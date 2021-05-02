import { Field, InputType, ObjectType } from '@nestjs/graphql';
import {
  PaginationInput,
  PaginationOutput,
} from 'src/common/dtos/pagination.dto';
import { Restaurant } from '../entities/restaurant.entity';

@InputType()
export class GetRestaurantInput extends PaginationInput {
  @Field((type) => Number)
  restaurantId: number;
}

@ObjectType()
export class GetRestaurantOutput extends PaginationOutput {
  @Field((type) => Restaurant, { nullable: true })
  restaurant?: Restaurant;
}
