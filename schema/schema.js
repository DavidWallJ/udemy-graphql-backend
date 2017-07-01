const graphql = require('graphql')
const axios = require('axios')
const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLSchema,
  GraphQLList,
  GraphQLNonNull
} = graphql

const CompanyType = new GraphQLObjectType({
  name: 'Company',
  // we use fields with the arrow function so that all the types inside are defined for the entire file
  // this is a closure
  // it allows code above and below it to access it
  fields: () => ({
    id: {type: GraphQLString},
    name: {type: GraphQLString},
    description: {type: GraphQLString},
    users: {
      // GraphQLList tells graphql we will be getting multiple results
      // many users associated with one company
      type: new GraphQLList(UserType),
      // the instance of the company we're currently looking at
      resolve(parentValue, args) {
        return axios.get(`http://localhost:3000/companies/${parentValue.id}/users`)
        // we can't just send on response because axios nests our response in 'data'
        // so we have to pull it out before we do anything else to it
          .then(res => res.data)
      }
    }
  })
})

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: {type: GraphQLString},
    firstName: {type: GraphQLString},
    age: {type: GraphQLInt},
    company: {
      type: CompanyType,
      resolve(parentValue, args) {
        return axios.get(`http://localhost:3000/companies/${parentValue.companyId}`)
          .then(res => res.data)
      }
    }
  })
})

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    user: {
      type: UserType,
      args: {id: {type: GraphQLString}},
      resolve(parentValue, args) {
        return axios.get(`http://localhost:3000/users/${args.id}`)
          .then(res => res.data)
      }
    },
    company: {
      type: CompanyType,
      args: {id: {type: GraphQLString}},
      resolve(parentValue, args) {
        return axios.get(`http://localhost:3000/companies/${args.id}`)
          .then(res => res.data)
      }
    }
  }
})

// mutations change the content of the db
const mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    addUser: {
      // the type of data we're going to return from the resolve function
      type: UserType,
      args: {
        // new GraphQLNonNull = must provide
        // must require up-above off of the graphql object
        // HOC; higher order function
        firstName: {type: new GraphQLNonNull(GraphQLString)},
        age: {type: GraphQLInt},
        companyId: {type: GraphQLString}
      },
      // we have access to the args in the resolve
      // same as firstName: firstName, etc.
      resolve(parentValue, {firstName, age, companyId}) {
        return axios.post('http://localhost:3000/users', {firstName, age, companyId})
          .then(res => res.data)
      }
    },
    deleteUser: {
      type: UserType,
      args: {
        id: {type: new GraphQLNonNull(GraphQLString)}
      },
      resolve(parentValue, {id}) {
        return axios.delete(`http://localhost:3000/users/${id}`)
        // we'll get a null back because GraphQL expects a res but db.json doesn't provide one
        // that's just the way it is
          .then(res => res.data)
      }
    },
    editUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        firstName: { type: GraphQLString },
        age: { type: GraphQLInt },
        companyId: { type: GraphQLString }
      },
      resolve(parentValue, args) {
        return axios.patch(`http://localhost:3000/users/${args.id}`, args)
        // we'll get a null back because GraphQL expects a res but db.json doesn't provide one
        // that's just the way it is
          .then(res => res.data)
      }
    }
  }
})

module.exports = new GraphQLSchema({
  // roots
  mutation,
  query: RootQuery
})
