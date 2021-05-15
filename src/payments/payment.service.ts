import { Injectable } from '@nestjs/common';
import { Cron, Interval, SchedulerRegistry, Timeout } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import {
  CreatePaymentInput,
  CreatePaymentOutput,
} from './dtos/create-payment.dto';
import { GetPaymentsOutput } from './dtos/get-payments.dto';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly payments: Repository<Payment>,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  async getPayments(user: User): Promise<GetPaymentsOutput> {
    try {
      const payments = await this.payments.find({ user });
      return { ok: true, payments };
    } catch (error) {
      return { ok: false, error: 'Could not get payments' };
    }
  }

  async createPayment(
    owner: User,
    { transactionId, restaurantId }: CreatePaymentInput,
  ): Promise<CreatePaymentOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId);
      if (!restaurant) return { ok: false, error: 'Restaurant not found' };
      if (restaurant.ownerId !== owner.id)
        return { ok: false, error: 'You are not allowed to create payment' };
      await this.payments.save(
        this.payments.create({
          transactionId,
          user: owner,
          restaurant,
        }),
      );
      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could not create payment' };
    }
  }

  @Cron('30 * * * * *', {
    name: 'paymentJob',
  })
  checkForPayments() {
    console.log('Checking for payments...(cron)');
    const job = this.schedulerRegistry.getCronJob('paymentJob');
    job.stop();
  }

  @Interval(30000)
  checkForPaymentsI() {
    console.log('Checking for payments...(interval)');
  }

  @Timeout(30000)
  checkForPaymentsT() {
    console.log('Checking for payments...(timeout)');
  }
}
