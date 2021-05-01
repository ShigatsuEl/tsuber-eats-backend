import {
  Args,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Role } from 'src/auth/role.decorator';
import { User } from 'src/users/entities/user.entity';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import { GetCategoriesOutput } from './dtos/get-categories.dto';
import { GetCategoryInput, GetCategoryOutput } from './dtos/get-category.dto';
import { Category } from './entities/category.entity';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurants.service';

@Resolver(() => Restaurant)
export class RestaurantResolver {
  // Provider에 RestaurantService를 추가함으로써 RestaurantService를 Resolver에서 사용할 수 있다.
  constructor(private readonly restaurantService: RestaurantService) {}

  @Mutation((returns) => CreateRestaurantOutput)
  @Role(['Owner'])
  async createRestaurant(
    @AuthUser() authUser: User,
    @Args('input') createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    return this.restaurantService.createResataurant(
      authUser,
      createRestaurantInput,
    );
  }

  @Mutation((returns) => EditRestaurantOutput)
  @Role(['Owner'])
  editRestaurant(
    @AuthUser() owner: User,
    @Args('input') editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    return this.restaurantService.editRestaurant(owner, editRestaurantInput);
  }

  @Mutation((returns) => DeleteRestaurantOutput)
  @Role(['Owner'])
  deleteRestaurant(
    @AuthUser() owner: User,
    @Args('input') deleteRestaurantInput: DeleteRestaurantInput,
  ) {
    return this.restaurantService.deleteRestaurant(
      owner,
      deleteRestaurantInput,
    );
  }
}

@Resolver(() => Category)
export class CategoryResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  @ResolveField((type) => Int)
  restaurantCount(@Parent() category: Category): Promise<number> {
    return this.restaurantService.countRestaurants(category);
  }

  @Query((type) => GetCategoriesOutput)
  getAllCategories(): Promise<GetCategoriesOutput> {
    return this.restaurantService.getAllCategories();
  }

  @Query((type) => GetCategoryOutput)
  getCategory(
    @Args() getCategoryInput: GetCategoryInput,
  ): Promise<GetCategoryOutput> {
    return this.restaurantService.getCategory(getCategoryInput);
  }
}
