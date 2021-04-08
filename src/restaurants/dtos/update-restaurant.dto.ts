import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateRestaurantDto } from './create-restaurant.dto';

// PartialType을 Restaurant로 하지 않고 CreateRestaurantDto로 하는 이유는 id가 필요하기 때문이다.
@InputType()
export class UpdateRestaurantInputType extends PartialType(
  CreateRestaurantDto,
) {}

// InputType을 사용한다면 argument에 이름이 있어야 하고 ArgsType을 사용한다면 이름이 없어도 된다.
@InputType()
export class UpdateRestaurantDto {
  @Field((type) => Number)
  id: number;

  @Field((type) => UpdateRestaurantInputType)
  data: UpdateRestaurantInputType;
}
