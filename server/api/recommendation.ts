export default defineEventHandler(async (event) => {
  // const body = await readBody(event)
  await new Promise((res) => setTimeout(() => res(true), 2000));
  return [
    {
      picture: "https://i.pinimg.com/564x/c8/07/0d/c8070da63af61cd4c26eef8cdba6058c.jpg",
      title: "nearby",
      href: "#",
    },
    {
      picture: "https://i.pinimg.com/564x/42/7c/9f/427c9f50cc93b0e74b6b5dbc757d101a.jpg",
      title: "hotels",
      href: "/hotel",
    },
    {
      picture: "https://i.pinimg.com/564x/f6/73/11/f67311fbb22f92f18dd28ff36cb54a25.jpg",
      title: "places",
      href: "#",
    },
    {
      picture: "https://i.pinimg.com/564x/99/c9/39/99c939f55373c967697e15af0d58a3fe.jpg",
      title: "rental",
      href: "/rental",
    },
    {
      picture: undefined,
      title: "See More",
      href: "#",
    },
  ];
});
