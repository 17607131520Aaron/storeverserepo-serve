import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
    comment: '用户名',
  })
  public username: string;

  @Column({
    type: 'varchar',
    length: 100,
    comment: '密码',
  })
  public password: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: '邮箱',
  })
  public email: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: '手机号',
  })
  public phone: string;

  @Column({
    type: 'tinyint',
    default: 1,
    comment: '状态：1-启用，0-禁用',
  })
  public status: number;

  @CreateDateColumn({
    comment: '创建时间',
  })
  public createdAt: Date;

  @UpdateDateColumn({
    comment: '更新时间',
  })
  public updatedAt: Date;
}
