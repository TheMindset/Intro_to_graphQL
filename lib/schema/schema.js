const environment = process.env.NODE_ENV || 'development'
const configuration = require('../../knexfile')[environment]
const database = require('knex')(configuration)

const Owner = require("../models/owner")
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
        return Owner.findOwnersPets(parent.id)
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
        return Owner.findOwner(args.id)
      }
    },
    owners: {
      type: new GraphQLList(OwnerType),
      resolve(parent, args) {
        return Owner.findAllOwners(args.id)
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
        return Owner.addOwners(args)
        .then(result => {
          return result[0]
        })
        .catch(error => error)
      }
    },
    deleteOwner: {
      type: GraphQLString, // after deleting return just a String
      args: { id: {type: GraphQLNonNull(GraphQLID)} },
      resolve(parent, args) {
        return Owner.deleteOwner(args.id)
        .then((result) => {
          if (result == 1) {
            return "Success"
          } else {
            return "Something went wrong, please check the id and try again"
          }
        })
        .catch(error => error)
      }
    },
    addPet: {
      type: PetType,
      args: {
        name: { type: GraphQLNonNull(GraphQLString) },
        animal_type: { type: GraphQLNonNull(GraphQLString) },
        breed: { type: GraphQLNonNull(GraphQLString) },
        age: { type: GraphQLNonNull(GraphQLInt) },
        favorite_treat: { type: GraphQLNonNull(GraphQLString) },
        owner_id: { type: GraphQLNonNull(GraphQLID) }
      },
      resolve(parent, args) {
        return database('pets')
        .returning('*')
        .insert({
          name: args.name,
          animal_type: args.animal_type,
          breed: args.breed,
          age: args.age,
          favorite_treat: args.favorite_treat,
          owner_id: args.owner_id
        })
        .then(result => result[0])
        .catch(error => error)
      }
    },
    deletePet: {
      type: GraphQLString,
      args: { id: {type: GraphQLNonNull(GraphQLID)} },
      resolve(parent, args) {
        return database('pets')
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