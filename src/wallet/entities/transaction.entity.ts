import { ETransactionCase } from "src/common/enum/status.enum";
import { Column, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ nullable: false })
    fromUserId: string;
    
    @Column({ nullable: false })
    toUserId: string;
    
    @Column({ default: '' })
    status: string;

    @Column({
        type: 'enum',
        nullable: true,
        enum: ETransactionCase,
        default: 'transaction',
      })
      case: string;
  
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