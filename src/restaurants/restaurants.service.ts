import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Raw, Repository } from 'typeorm';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import { GetCategoriesOutput } from './dtos/get-categories.dto';
import { GetCategoryInput, GetCategoryOutput } from './dtos/get-category.dto';
import { GetOwnerRestaurantsOutput } from './dtos/get-owner-restaurants.dto';
import {
  GetOwnerRestaurantInput,
  GetOwnerRestaurantOutput,
} from './dtos/get-owner-restaurant.dto';
import {
  GetRestaurantInput,
  GetRestaurantOutput,
} from './dtos/get-restaurant.dto';
import {
  GetRestaurantsInput,
  GetRestaurantsOutput,
} from './dtos/get-restaurants.dto';
import {
  SearchRestaurantInput,
  SearchRestaurantOutput,
} from './dtos/search-restaurant.dto';
import { Category } from './entities/category.entity';
import { Dish } from './entities/dish.entity';
import { Restaurant } from './entities/restaurant.entity';
import { CategoryRepository } from './repositories/category.repository';
import { RestaurantRepository } from './repositories/restaurant.repository';

@Injectable()
export class RestaurantService {
  constructor(
    // @InjectRepository가 getRepository의 역할을 하며 Restaurant Entity를 inject함으로써 Repository를 가져와 NestJS TypeORM을 사용할 수 있는 것이다.
    private readonly restaurants: RestaurantRepository,
    private readonly categories: CategoryRepository,
    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,
  ) {}

  async getAllRestaurants({
    page,
  }: GetRestaurantsInput): Promise<GetRestaurantsOutput> {
    try {
      const [restaurants, totalResults] = await this.restaurants.findAndCount({
        skip: (page - 1) * 6,
        take: 6,
        order: {
          isPromoted: 'DESC',
        },
      });
      return {
        ok: true,
        results: restaurants,
        totalPages: Math.ceil(totalResults / 6),
        totalResults,
      };
    } catch (error) {
      return { ok: false, error: 'Could not load restaurants' };
    }
  }

  async getRestaurant({
    restaurantId,
  }: GetRestaurantInput): Promise<GetRestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId, {
        relations: ['menu'],
      });
      if (!restaurant) return { ok: false, error: 'Restaurant not found' };
      return { ok: true, restaurant };
    } catch (error) {
      return { ok: false, error: 'Could not load restaurant' };
    }
  }

  async getOwnerRestaurants(owner: User): Promise<GetOwnerRestaurantsOutput> {
    try {
      const restaurants = await this.restaurants.find({ owner });
      if (!restaurants) return { ok: false, error: 'Restaurants not found' };
      return { ok: true, restaurants };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not load restaurants',
      };
    }
  }

  async getOwnerRestaurant(
    owner: User,
    { id }: GetOwnerRestaurantInput,
  ): Promise<GetOwnerRestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne(
        { owner, id },
        { relations: ['menu', 'orders'] },
      );
      if (!restaurant) return { ok: false, error: 'Restaurant not found' };
      return { ok: true, restaurant };
    } catch (error) {
      return { ok: false, error: 'Could not load restaurant' };
    }
  }

  async searchRestaurant({
    query,
    page,
  }: SearchRestaurantInput): Promise<SearchRestaurantOutput> {
    try {
      const [restaurants, totalResults] = await this.restaurants.findAndCount({
        where: {
          name: Raw((name) => `${name} ILIKE '%${query}%'`),
        },
        skip: (page - 1) * 6,
        take: 6,
      });
      return {
        ok: true,
        results: restaurants,
        totalPages: Math.ceil(totalResults / 6),
        totalResults,
      };
    } catch (error) {
      return { ok: false, error: 'Could not search for restaurants' };
    }
  }

  async createResataurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      // create 메서드는 타입스크립트가 가지고 있을 뿐 DB에 저장하지 않는다.
      // DB에 저장하기 위해서는 save 메서드를 사용한다.
      const newRestaurant = this.restaurants.create(createRestaurantInput);
      const category = await this.categories.getOrCreate(
        createRestaurantInput.categoryName,
      );
      newRestaurant.category = category;
      newRestaurant.owner = owner;
      await this.restaurants.save(newRestaurant);
      return { ok: true, restaurantId: newRestaurant.id };
    } catch (error) {
      return { ok: false, error: 'Could not create restaurant' };
    }
  }

  async editRestaurant(
    owner: User,
    editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    try {
      const check = await this.restaurants.checkOne(
        owner.id,
        editRestaurantInput.restaurantId,
        'edit',
      );
      let category: Category = null;
      if (check) return { ...check };
      if (editRestaurantInput.categoryName) {
        category = await this.categories.getOrCreate(
          editRestaurantInput.categoryName,
        );
      }
      // save 메서드에서 id를 보내지 않을 경우, 새로운 Entity를 생성하므로 update하기 위해선 꼭 포함시킨다
      await this.restaurants.save([
        {
          id: editRestaurantInput.restaurantId,
          ...editRestaurantInput,
          ...(category && { category }),
        },
      ]);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could not edit Restaurant' };
    }
  }

  async deleteRestaurant(
    owner: User,
    { restaurantId }: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    try {
      const check = await this.restaurants.checkOne(
        owner.id,
        restaurantId,
        'delete',
      );
      if (check) return { ...check };
      await this.restaurants.delete(restaurantId);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could not delete Restaurant' };
    }
  }

  countRestaurants(category: Category) {
    return this.restaurants.count({ category });
  }

  async getAllCategories(): Promise<GetCategoriesOutput> {
    try {
      const categories = await this.categories.find();
      return { ok: true, categories };
    } catch (error) {
      return { ok: false, error: 'Can not load categories' };
    }
  }

  async getCategory({
    slug,
    page,
  }: GetCategoryInput): Promise<GetCategoryOutput> {
    try {
      const category = await this.categories.findOne({ slug });
      const restaurants = await this.restaurants.find({
        where: { category },
        take: 6,
        skip: (page - 1) * 6,
        order: {
          isPromoted: 'DESC',
        },
      });
      category.restaurants = restaurants;
      const totalResults = await this.countRestaurants(category);
      if (!category) return { ok: false, error: 'Category not found' };
      return {
        ok: false,
        results: category,
        restaurants,
        totalPages: Math.ceil(totalResults / 6),
        totalResults,
      };
    } catch (error) {
      return { ok: false, error: 'Can not load category' };
    }
  }

  async createDish(
    owner: User,
    createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    try {
      const restaurant = await this.restaurants.findOne(
        createDishInput.restaurantId,
      );
      if (!restaurant) {
        return { ok: false, error: 'Restaurant not found' };
      }
      if (owner.id !== restaurant.ownerId) {
        return {
          ok: false,
          error: `You can not get a restaurant that you do not own`,
        };
      }
      await this.dishes.save(
        this.dishes.create({ ...createDishInput, restaurant }),
      );
      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could not create dish' };
    }
  }

  async editDish(
    owner: User,
    editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    try {
      const dish = await this.dishes.findOne(editDishInput.dishId, {
        relations: ['restaurant'],
      });
      if (!dish) return { ok: false, error: 'Dish not found' };
      if (owner.id !== dish.restaurant.ownerId) {
        return {
          ok: false,
          error: 'You can not delete a dish that you do not own',
        };
      }
      await this.dishes.save([
        {
          id: editDishInput.dishId,
          ...editDishInput,
        },
      ]);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could not delete dish' };
    }
  }

  async deleteDish(
    owner: User,
    { dishId }: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    try {
      const dish = await this.dishes.findOne(dishId, {
        relations: ['restaurant'],
      });
      if (!dish) return { ok: false, error: 'Dish not found' };
      if (owner.id !== dish.restaurant.ownerId) {
        return {
          ok: false,
          error: 'You can not delete a dish that you do not own',
        };
      }
      await this.dishes.delete(dishId);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could not delete dish' };
    }
  }
}
