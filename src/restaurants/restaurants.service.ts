import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { CreateRestaurantDto } from './dtos/create-restaurant.dto';
import { UpdateRestaurantDto } from './dtos/update-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';

@Injectable()
export class RestaurantService {
  constructor(
    // @InjectRepository가 getRepository의 역할을 하며 Restaurant Entity를 inject함으로써 Repository를 가져와 NestJS TypeORM을 사용할 수 있는 것이다.
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
  ) {}

  getAll(): Promise<Restaurant[]> {
    return this.restaurants.find();
  }

  createResataurant(
    createRestaurantDto: CreateRestaurantDto,
  ): Promise<Restaurant> {
    // create 메서드는 타입스크립트가 가지고 있을 뿐 DB에 저장하지 않는다.
    // DB에 저장하기 위해서는 save 메서드를 사용한다.
    const newRestaurant = this.restaurants.create(createRestaurantDto);
    return this.restaurants.save(newRestaurant);
  }

  updateRestaurant({ id, data }: UpdateRestaurantDto): Promise<UpdateResult> {
    return this.restaurants.update(id, { ...data });
  }
}
