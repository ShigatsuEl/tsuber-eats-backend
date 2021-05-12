import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { GetOrdersInput, GetOrdersOutuput } from './dtos/get-orders.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';

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
      await this.orders.save(
        this.orders.create({
          customer,
          restaurant,
          total: orderTotalPrice,
          items: orderItems,
        }),
      );
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
}
