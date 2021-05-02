import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import {
  PaginationInput,
  PaginationOutput,
} from 'src/common/dtos/pagination.dto';
import { Category } from '../entities/category.entity';

@InputType()
export class GetCategoryInput extends PaginationInput {
  @Field((type) => String)
  slug: string;
}

@ObjectType()
export class GetCategoryOutput extends PaginationOutput {
  @Field((type) => Category, { nullable: true })
  category?: Category;
}
