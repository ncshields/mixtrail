import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
export const runtime="edge";

const Body = z.object({ listName: z.string().min(1), picks: z.array(z.object({ gc_code:z.string() })).min(1) });

export async function POST(req: NextRequest){
  Body.parse(await req.json());
  const fakeId = Math.random().toString(36).slice(2,10);
  const url = `https://www.geocaching.com/plan/lists/${fakeId}?mock=1`;
  return NextResponse.json({ ok:true, listUrl:url });
}
