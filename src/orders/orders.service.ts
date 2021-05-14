import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PubSub } from 'graphql-subscriptions';
import { NEW_PENDING_ORDER, PUB_SUB } from 'src/common/common.constants';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { GetOrdersInput, GetOrdersOutuput } from './dtos/get-orders.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order, OrderStatus } from './entities/order.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItems: Repository<OrderItem>,
    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  async createOrder(
    customer: User,
    { restaurantId, items }: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId);
      if (!restaurant) return { ok: false, error: 'Restaurant not found' };
      const orderItems: OrderItem[] = [];
      let orderTotalPrice = 0;
      // Dto를 통해 받아온 items로부터 orderItem을 생성하고 order을 생성한다.
      for (const item of items) {
        const dish = await this.dishes.findOne(item.dishId);
        let dishTotalPrice = dish.price;
        if (!dish) return { ok: false, error: 'Dish not found' };
        for (const itemOption of item.options) {
          const dishOption = dish.options.find(
            (dishOption) => dishOption.name === itemOption.name,
          );
          if (dishOption) {
            if (dishOption.extra) {
              dishTotalPrice += dishOption.extra;
            } else {
              const dishOptionChoice = dishOption.choices.find(
                (optionChoice) => optionChoice.name === itemOption.choice,
              );
              if (dishOptionChoice && dishOptionChoice.extra) {
                dishTotalPrice += dishOptionChoice.extra;
              }
            }
          }
        }
        orderTotalPrice += dishTotalPrice;
        const orderItem = await this.orderItems.save(
          this.orderItems.create({
            dish,
            options: item.options,
          }),
        );
        orderItems.push(orderItem);
      }
      const order = await this.orders.save(
        this.orders.create({
          customer,
          restaurant,
          total: orderTotalPrice,
          items: orderItems,
        }),
      );
      await this.pubSub.publish(NEW_PENDING_ORDER, {
        pendingOrders: { order, ownerId: restaurant.ownerId },
      });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Can not create order' };
    }
  }

  async getOrders(
    user: User,
    { status }: GetOrdersInput,
  ): Promise<GetOrdersOutuput> {
    try {
      let orders: Order[];
      switch (user.role) {
        case UserRole.Client:
          orders = await this.orders.find({
            where: { customer: user, ...(status && { status }) },
          });
          break;
        case UserRole.Delivery:
          orders = await this.orders.find({
            where: { driver: user, ...(status && { status }) },
          });
          break;
        case UserRole.Owner:
          const restaurants = await this.restaurants.find({
            where: { owner: user },
            relations: ['orders'],
          });
          orders = restaurants.map((restaurant) => restaurant.orders).flat(1);
          if (status) {
            orders = orders.filter((order) => order.status === status);
          }
          break;
        default:
          break;
      }
      return { ok: true, orders };
    } catch (error) {
      return { ok: false, error: 'Could not get orders' };
    }
  }

  allowedOrder(user: User, order: Order): boolean {
    let allowed = true;
    if (user.role === UserRole.Client && order.customerId !== user.id)
      allowed = false;
    if (user.role === UserRole.Delivery && order.driverId !== user.id)
      allowed = false;
    if (user.role === UserRole.Owner && order.restaurant.ownerId !== user.id)
      allowed = false;
    return allowed;
  }

  async getOrder(
    user: User,
    { id: orderId }: GetOrderInput,
  ): Promise<GetOrderOutput> {
    try {
      const order = await this.orders.findOne(orderId, {
        relations: ['restaurant'],
      });
      if (!order) return { ok: false, error: 'Order not found' };
      const allowed = this.allowedOrder(user, order);
      if (!allowed) return { ok: false, error: 'You can not see that order' };
      return { ok: true, order };
    } catch (error) {
      return { ok: false, error: 'Could not get order' };
    }
  }

  async editOrder(
    user: User,
    { id: orderId, status }: EditOrderInput,
  ): Promise<EditOrderOutput> {
    try {
      const order = await this.orders.findOne(orderId, {
        relations: ['restaurant'],
      });
      if (!order) return { ok: false, error: 'Order not found' };
      if (!this.allowedOrder(user, order))
        return { ok: false, error: 'You can not see that order' };
      let allowedEdit = true;
      if (user.role === UserRole.Client) {
        allowedEdit = false;
      }
      if (user.role === UserRole.Owner) {
        if (status !== OrderStatus.Cooking && status !== OrderStatus.Cooked) {
          allowedEdit = false;
        }
      }
      if (user.role === UserRole.Delivery) {
        if (
          status !== OrderStatus.PickedUp &&
          status !== OrderStatus.Delevered
        ) {
          allowedEdit = false;
        }
      }
      if (!allowedEdit)
        return {
          ok: false,
          error: 'You do not have permission or can not edit',
        };
      await this.orders.save([{ id: orderId, status }]);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could not edit order' };
    }
  }
}
