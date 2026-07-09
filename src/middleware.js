import { NextResponse } from "next/server";

export const middleware = (request) => {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
