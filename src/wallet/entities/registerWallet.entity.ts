import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Generated,
  } from 'typeorm';
  
  @Entity()
  export class RegisterWallet {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({
      unique: true,
      nullable: false,
    })
    @Generated('uuid')
    clientId: string;
  
    @Column({
      nullable: false,
    })
    appName: string;
  
    @Column({ unique: true, nullable: false })
    publicKey: string;
  
    @Column({ nullable: true })
    encryptedPrivateKey: string;
  
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
  