import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { createRestaurantDto } from './dtos/create-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurants.service';

@Resolver(() => Restaurant)
export class RestaurantResolver {
  // Provider에 RestaurantService를 추가함으로써 RestaurantService를 Resolver에서 사용할 수 있다.
  constructor(private readonly restaurantService: RestaurantService) {}
  @Query((returns) => [Restaurant])
  restaurants(): Promise<Restaurant[]> {
    return this.restaurantService.getAll();
  }
  @Mutation((returns) => Restaurant)
  createRestaurant(@Args() createRestaurantDto: createRestaurantDto): boolean {
    return true;
  }
}
