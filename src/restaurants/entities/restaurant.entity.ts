import { Field, ObjectType } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';
import { Core } from 'src/common/entities/core.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Category } from './category.entity';

// GraphQL을 위한 ObjectType / Field
// TypeORM을 위한 Entity / Column
@ObjectType()
@Entity()
export class Restaurant extends Core {
  @Field((type) => String)
  @Column()
  @IsString()
  @Length(5)
  name: string;

  @Field((type) => String)
  @Column()
  @IsString()
  coverImg: string;

  @Field((type) => String, { defaultValue: '서울' })
  @Column()
  @IsString()
  address: string;

  @Field((type) => Category)
  @ManyToOne((type) => Category, (category) => category.restaurants)
  category: Category;
}
