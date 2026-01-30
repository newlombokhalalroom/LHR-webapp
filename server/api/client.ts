export default defineEventHandler(async (event) => {
  // const body = await readBody(event)
  await new Promise((res) => setTimeout(() => res(true), 2000));
  const _query = getQuery(event);
  let _data = [
    {
      _id: "dfb5cc56-62ef-4f15-b5e2-96d7eb3f6e44",
      type: "hotel",
      slug: "grand-madani-hotel",
      name: "Grand Madani Hotel",
      picture:
        "https://i.pinimg.com/564x/42/7c/9f/427c9f50cc93b0e74b6b5dbc757d101a.jpg",
      email: "abcd@gmail.com",
      description:
        "Non ad aute labore culpa sunt labore. Officia proident esse id laboris commodo ullamco ipsum magna nostrud excepteur. Velit tempor nisi sint enim in magna. Nisi consequat consequat exercitation aliquip quis sunt elit aliqua mollit minim velit. Tempor ullamco anim nulla exercitation velit laboris fugiat quis est incididunt proident proident est. Ullamco dolore fugiat velit id labore consectetur laborum occaecat. Laborum voluptate consectetur occaecat excepteur dolore eiusmod elit.",
    },
    {
      _id: "5da989c6-1beb-4a2f-b5b1-c62166753e3f",
      type: "transportation",
      name: "Rinjani Travel",
      slug: "transportation-rinjani-travel",
      email: "abcd@gmail.com",
      description:
        "Non ad aute labore culpa sunt labore. Officia proident esse id laboris commodo ullamco ipsum magna nostrud excepteur. Velit tempor nisi sint enim in magna. Nisi consequat consequat exercitation aliquip quis sunt elit aliqua mollit minim velit. Tempor ullamco anim.",
    },
    {
      _id: "5da989c6-1beb-4a2f-d5b1-c62166753e263",
      type: "transportation",
      slug: "transportation-mataram-go",
      name: "Mataram Go",
      email: "abcd@gmail.com",
      description:
        "Non ad aute labore culpa sunt labore. Officia proident esse id laboris commodo ullamco ipsum magna nostrud excepteur. Velit tempor nisi sint enim in magna. Nisi consequat consequat exercitation aliquip quis sunt elit aliqua mollit minim velit. Tempor ullamco anim.",
    },
    {
      _id: "9152ea6e-2c8f-4a7f-b641-989d2b05c1d6",
      type: "place",
      name: "Senggigi Beach",
      email: "abcd@gmail.com",
      description:
        "Tempor ullamco anim nulla exercitation velit laboris fugiat quis est incididunt proident proident est. Ullamco dolore fugiat velit id labore consectetur laborum occaecat. Laborum voluptate consectetur occaecat excepteur dolore eiusmod elit.",
    },
    {
      _id: "1e6c1f14-3461-420d-af91-618b14a9c2ef",
      type: "hotel",
      slug: "sembalun-homestay",
      name: "Sembalun Homestay",
      email: "abcd@gmail.com",
      picture:
        "https://i.pinimg.com/564x/40/61/9a/40619a0fe93053cf3daebacf273496c5.jpg",
      description:
        "Non ad aute labore culpa sunt labore. Officia proident esse id laboris commodo ullamco ipsum magna nostrud excepteur. Velit tempor nisi sint enim in magna. Nisi consequat consequat exercitation aliquip quis sunt elit aliqua mollit minim velit.",
    },
    {
      _id: "0d220dce-8d38-4ec5-921f-3aa70ddb4f19",
      type: "place",
      name: "Sembalun Indah",
      email: "abcd@gmail.com",
      description:
        "Ipsum magna nostrud excepteur. Velit tempor nisi sint enim in magna. Nisi consequat consequat exercitation aliquip quis sunt elit aliqua mollit minim velit. Tempor ullamco anim nulla exercitation velit laboris fugiat quis est incididunt proident proident est. Ullamco dolore fugiat velit id labore consectetur laborum occaecat.",
    },
    {
      _id: "211e67dd-d7fb-484a-b4d9-615276cf8bfc",
      type: "hotel",
      name: "Hotel Rinjani",
      slug: "hotel-rinjani",
      email: "abcd@gmail.com",
      picture:
        "https://i.pinimg.com/564x/14/28/57/1428579a88fe31ddc069b1ce84a3dcd8.jpg",
      description:
        "Non ad aute labore culpa sunt labore. Officia proident esse id laboris commodo ullamco ipsum magna nostrud excepteur. Velit tempor nisi sint enim in magna. Nisi consequat consequat exercitation aliquip quis sunt elit aliqua mollit minim velit.",
    },
    {
      _id: "edd47bc1-d9d4-409c-b332-ca0975d3c18f",
      type: "hotel",
      name: "Lombok Raya",
      slug: "lombok-raya",
      email: "abcd@gmail.com",
      picture:
        "https://i.pinimg.com/564x/93/19/0d/93190de75c24cd83fa4025bd3a4977f9.jpg",
      description:
        "Non ad aute labore culpa sunt labore. Officia proident esse id laboris commodo ullamco ipsum magna nostrud excepteur. Velit tempor nisi sint enim in magna. Nisi consequat consequat exercitation aliquip quis sunt elit aliqua mollit minim velit..",
    },
    {
      _id: "594b2174-6032-4a5e-a04f-8ae94f11a047",
      type: "place",
      name: "Taman Langit",
      email: "abcd@gmail.com",
      description:
        "Non ad aute labore culpa sunt labore. Officia proident esse id laboris commodo ullamco ipsum magna nostrud excepteur. Velit tempor nisi sint enim in magna. Nisi consequat consequat exercitation aliquip quis sunt elit aliqua mollit minim velit.",
    },
  ];

  if (_query?.type) {
    return _data.filter((_item) => _item.type == _query?.type);
  }

  if (_query?.slug) {
    return _data.find((_item) => _item?.slug == _query?.slug);
  }

  return _data;
});
