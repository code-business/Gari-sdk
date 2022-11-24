import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm';
  
  @Entity()
  export class Wallet {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({
      unique: true,
      nullable: false,
    })
    userId: string;
  
    @Column({
      nullable: false,
    })
    clientId: string;
  
    @Column({
      nullable: false,
    })
    appName: string;
  
    // will save app publick key or userpublic key
    @Column({ nullable: false })
    publicKey: string;
  
    // since we are not creating tokenAssociatedAccount for new ludo user so initially nullable : true
    @Column({ nullable: true })
    tokenAssociatedAccount: string;
  
    @Column({ nullable: true })
    encryptedPrivateKey: string;
  
    @Column({ default: 0, type: 'bigint' })
    balance: string;
  
    @CreateDateColumn({
      type: 'timestamptz',
      default: () => 'CURRENT_TIMESTAMP(6)',
    })
    created_at: Date;
  
    @UpdateDateColumn({
      type: 'timestamptz',
      default: () => 'CURRENT_TIMESTAMP(6)',
      onUpdate: 'CURRENT_TIMESTAMP(6)',
    })
    updated_at: Date;
  }
  