import { Injectable } from '@nestjs/common';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { EntityRepository, Repository } from 'typeorm';
import { Restaurant } from '../entities/restaurant.entity';

@EntityRepository(Restaurant)
export class RestaurantRepository extends Repository<Restaurant> {
  async checkOne(
    ownerId: number,
    restaurantId: number,
    method: string,
  ): Promise<CoreOutput> {
    const restaurant = await this.findOne(restaurantId);
    if (!restaurant) {
      return { ok: false, error: 'Restaurant not found' };
    }
    if (ownerId !== restaurant.ownerId) {
      return {
        ok: false,
        error: `You can not ${method} a restaurant that you do not own`,
      };
    }
  }
}
