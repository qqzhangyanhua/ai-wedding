import { NextResponse } from 'next/server';
import { CreateOrderSchema, validateData } from '@/lib/validations';

/**
 * 订单验证API - 在创建订单前验证数据
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const validation = validateData(CreateOrderSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        {
          valid: false,
          error: validation.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      data: validation.data,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Validation error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

