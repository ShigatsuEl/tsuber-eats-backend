import { Field, ObjectType } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';
import { Core } from 'src/common/entities/core.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { Restaurant } from './restaurant.entity';

@ObjectType()
@Entity()
export class Category extends Core {
  @Field((type) => String)
  @Column()
  @IsString()
  @Length(5)
  name: string;

  @Field((type) => String)
  @Column()
  @IsString()
  coverImg: string;

  // OneToMany 데코레이터는 첫번째 인자로 타입을 적어주고 두번째 인자는 inverse로 상대방 쪽에서 어떻게 보여지는지를 결정한다
  @Field((type) => [Restaurant])
  @OneToMany((type) => Restaurant, (restaurant) => restaurant.category)
  restaurants: Restaurant[];
}
