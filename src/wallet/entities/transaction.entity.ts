// import { ETransactionCase } from "src/common/enum/status.enum";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
@Entity()
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
      nullable: false,
    })
    clientId: string;
  
    @Column({
      nullable: false,
    })
    appName: string;
  
    @Column({ nullable: false })
    fromUserId: string;
    
    @Column({ nullable: false })
    toUserId: string;
    
    @Column({ default: '' })
    status: string;

    @Column({
      nullable: true,
    })
    case: string;

    @Column({ nullable: false })
    fromPublicKey: string;
  
    @Column()
    toPublicKey: string;
    
    @Column({ nullable: true })
    signature: string;
  
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

    @Column({ default: 0, type: 'bigint' })
    chinagriCommission: string;
  
    // @Column({ default: 0, type: 'bigint' })
    // coins: string;
  
    @Column({ default: 0, type: 'bigint' })
    solanaFeeInLamports: string;
  
    @Column({ default: 0, type: 'bigint' })
    totalTransactionAmount: string;
  }