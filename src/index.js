require("dotenv").config()

const { ApolloServer } = require("apollo-server")
const typeDefs = require("./schema")
const resolvers = require("./resolvers")
const postgresDB = require("./datasources/postgresDB")

const { getUser, createStore } = require("./utils")
const store = createStore()

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const token = req.get("Authorization") || ""
    if (!req) {
      return null
    }
    const user = getUser(token.replace("Bearer", ""))
    return { user }
  },
  introspection: true,
  playground: true,
  dataSources: () => ({
    postgresDB: new postgresDB({ store }),
  }),
  engine: {
    apiKey: process.env.APOLLO_KEY,
    graphVariant: "production",
  },
})

// The `listen` method launches a web server.
server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
  console.log(`Server ready at ${url}`)
})
