import { InputType, OmitType } from '@nestjs/graphql';
import { Restaurant } from '../entities/restaurant.entity';

// 기본적으로 Mapped Type(Partial|Pick|Omit|Intersection)들은 모든 base class들이 InputType이어야 한다
// Mapped Type의 세번째 인자는 base class의 decorator를 바꿀수 있도록 허용해준다.
// 명시하지 않으면 기본적으로 child class는 parent class와 같은 decorator를 사용하게 된다.
@InputType()
export class CreateRestaurantDto extends OmitType(Restaurant, ['id']) {}
