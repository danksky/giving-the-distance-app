import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get("placeId");

  if (!placeId) {
    return NextResponse.json({ error: "Place ID is required" }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Maps API key not configured" },
      { status: 500 }
    );
  }

  try {
    // Fetch place details including photos
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${apiKey}`
    );

    const data = await response.json();

    if (data.status !== "OK" || !data.result?.photos) {
      return NextResponse.json({ photos: [] });
    }

    // Get up to 5 photos
    const photos = data.result.photos.slice(0, 5).map((photo: any) => {
      // Construct the photo URL
      return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${apiKey}`;
    });

    return NextResponse.json({ photos });
  } catch (error) {
    console.error("Error fetching place photos:", error);
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 }
    );
  }
}
