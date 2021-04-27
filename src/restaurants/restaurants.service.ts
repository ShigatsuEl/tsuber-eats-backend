import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';

@Injectable()
export class RestaurantService {
  constructor(
    // @InjectRepository가 getRepository의 역할을 하며 Restaurant Entity를 inject함으로써 Repository를 가져와 NestJS TypeORM을 사용할 수 있는 것이다.
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
  ) {}

  async createResataurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      // create 메서드는 타입스크립트가 가지고 있을 뿐 DB에 저장하지 않는다.
      // DB에 저장하기 위해서는 save 메서드를 사용한다.
      const newRestaurant = this.restaurants.create(createRestaurantInput);
      await this.restaurants.save(newRestaurant);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could not create restaurant' };
    }
  }
}
