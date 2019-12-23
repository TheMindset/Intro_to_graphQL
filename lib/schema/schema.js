const environment = process.env.NODE_ENV || 'development'
const configuration = require('../../knexfile')[environment]
const database = require('knex')(configuration)

const graphql = require('graphql')

// require GraphQL datatypes from graphql
const {
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLSchema,
  GraphQLNonNull
} = graphql

// Defining the PetType
// Telling of our user wich type of information they can ask.
const PetType = new GraphQLObjectType({
  name: 'Pet',
  // the "fields" property must be a function => Execution Call Stack
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    animal_type: { type: GraphQLString },
    breed: { type: GraphQLString },
    age: { type: GraphQLInt },
    favorite_treat: { type: GraphQLString },
    owner: {
      type: OwnerType,
      resolve(parent, args) {
        return database('pets')
        .join('owners', {'pets.owner_id': 'owners.id'})
        .where('owners.id', parent.owner_id)
        .first()
      }
    }
  })
})

// Defining the OwnerType
const OwnerType = new GraphQLObjectType({
  name: 'Owner',
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    age: { type: GraphQLString },
    pets: {
      type: new GraphQLList(PetType),
      resolve(parent, args) {
        return database('owners')
        .join('pets', {'owners.id': 'pets.owner_id'})
        .where('pets.owner_id', parent.id).select()
      }
    }
  })
})

// Giving the way for our User to ask information
// Query that returns all pets
const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    pet: {
      type: PetType,
      args: { id: { type: GraphQLID } },
      resolve(parent, args) {
        return database('pets').where('id', args.id).first()
      }
    },
    pets: {
      type: new GraphQLList(PetType),
      resolve(parent, args) {
        return database('pets').select()
      }
    },
    owner: {
      type: OwnerType,
      args: {id: {type: GraphQLID} },
      resolve(parent, args) {
        return database('owners').where('id', args.id).first()
      }
    },
    onwers: {
      type: new GraphQLList(OwnerType),
      resolve(parent, args) {
        return database('owners').select()
      }
    }
  }
})

const Mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    addOwner: {
      type: OwnerType,
      args: {
        name: { type: GraphQLNonNull(GraphQLString) },
        age: { type: GraphQLNonNull(GraphQLInt) }
      },
      resolve(parent, args) {
        return database('owners')
        .returning('*')
        .insert({
          name: args.name,
          age: args.age
        })
        .then(result => {
          console.log(result)
          return result[0]
        })
        .catch(error => error)
      }
    },
    deleteOwner: {
      type: GraphQLString,
      args: { id: {type: GraphQLNonNull(GraphQLID)} },
      resolve(parent, args) {
        return database('owners')
        .where('id', args.id)
        .del()
        .then((result) => {
          if (result == 1) {
            return "Success"
          } else {
            return "Something went wrong, please check the id and try again"
          }
        })
        .catch(error => error)
      }
    }
  }
})

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation
})