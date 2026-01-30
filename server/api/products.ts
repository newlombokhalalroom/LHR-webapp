export default defineEventHandler(async (event) => {
  // const body = await readBody(event)
  await new Promise((res) => setTimeout(() => res(true), 2000));
  return [
    {
      _id: "6a0ed3c6-1250-4ece-9411-601527b19e53",
      clientId: "dfb5cc56-62ef-4f15-b5e2-96d7eb3f6e44",
      clientName: "Grand Madani Hotel",
      title: "Regular Room Single Bed",
      qty: 100,
      price: 270000,
      description:
        "Non ad aute labore culpa sunt labore. Officia proident esse id laboris commodo ullamco ipsum magna nostrud excepteur. Velit tempor nisi sint enim in magna. Nisi consequat consequat exercitation aliquip quis sunt elit aliqua mollit minim velit.",
    },
    {
      _id: "f430e96c-55ce-4021-a38f-67fb870ed1b6",
      clientId: "dfb5cc56-62ef-4f15-b5e2-96d7eb3f6e44",
      clientName: "Grand Madani Hotel",
      title: "Deluxe Room Single Bed",
      qty: 100,
      price: 350000,
      description:
        "Non ad aute labore culpa sunt labore. Officia proident esse id laboris commodo ullamco ipsum magna nostrud excepteur. Velit tempor nisi sint enim in magna. Nisi consequat consequat exercitation aliquip quis sunt elit aliqua mollit minim velit. Tempor ullamco anim.",
    },
    {
      _id: "d94c46cc-d7c4-4728-b18a-ee102ebaf9df",
      clientId: "dfb5cc56-62ef-4f15-b5e2-96d7eb3f6e44",
      clientName: "Grand Madani Hotel",
      title: "Deluxe Room Double Bed",
      qty: 100,
      price: 434000,
      description:
        "Tempor ullamco anim nulla exercitation velit laboris fugiat quis est incididunt proident proident est. Ullamco dolore fugiat velit id labore consectetur laborum occaecat. Laborum voluptate consectetur occaecat excepteur dolore eiusmod elit.",
    },
    {
      _id: "2352ef51-1ddc-4165-850a-60654ba82804",
      clientId: "9152ea6e-2c8f-4a7f-b641-989d2b05c1d6",
      clientName: "Senggigi Beach",
      title: "Ticket Type 1",
      qty: 9999,
      price: 3000,
      description:
        "Ipsum magna nostrud excepteur. Velit tempor nisi sint enim in magna. Nisi consequat consequat exercitation aliquip quis sunt elit aliqua mollit minim velit. Tempor ullamco anim nulla exercitation velit laboris fugiat quis est incididunt proident proident est. Ullamco dolore fugiat velit id labore consectetur laborum occaecat.",
    },
    {
      _id: "939b2c56-4090-4a89-b872-d486d78a5f5a",
      clientId: "9152ea6e-2c8f-4a7f-b641-989d2b05c1d6",
      clientName: "Senggigi Beach",
      title: "Ticket Type 2",
      qty: 9999,
      price: 7000,
      description:
        "Non ad aute labore culpa sunt labore. Officia proident esse id laboris commodo ullamco ipsum magna nostrud excepteur. Velit tempor nisi sint enim in magna. Nisi consequat consequat exercitation aliquip quis sunt elit aliqua mollit minim velit.",
    },
    {
      _id: "30b55de1-0a97-4815-afcf-8eed2d71d533",
      clientId: "594b2174-6032-4a5e-a04f-8ae94f11a047",
      clientName: "Taman Langit",
      title: "Ticket 1",
      qty: 9999,
      price: 2000,
      description:
        "Non ad aute labore culpa sunt labore. Officia proident esse id laboris commodo ullamco ipsum magna nostrud excepteur. Velit tempor nisi sint enim in magna. Nisi consequat consequat exercitation aliquip quis sunt elit aliqua mollit minim velit.",
    },
    {
      _id: "30b55de1-0a97-4815-afcf-8eed2d71d533",
      clientId: "594b2174-6032-4a5e-a04f-8ae94f11a047",
      clientName: "Taman Langit",
      title: "Ticket 2",
      qty: 9999,
      price: 5000,
      description:
        "Non ad aute labore culpa sunt labore. Officia proident esse id laboris commodo ullamco ipsum magna nostrud excepteur. Velit tempor nisi sint enim in magna. Nisi consequat consequat exercitation aliquip quis sunt elit aliqua mollit minim velit.",
    },
  ];
});
