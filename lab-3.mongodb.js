use("mflix");

db.getCollectionNames();

db.users.find().limit(1).toArray();

db.users.findOne();

// NOTE: Agregar las siguientes reglas de validación usando JSON Schema.
// Luego de cada especificación testear que efectivamente las reglas de
// validación funcionen, intentando insertar 5 documentos válidos y 5 inválidos
// (por distintos motivos).

// 1. Especificar en la colección users las siguientes reglas de validación:
// El campo name (requerido) debe ser un string con un máximo de 30 caracteres,
// email (requerido) debe ser un string que matchee con la expresión regular:
// "^(.*)@(.*)\\.(.{2,4})$" , password (requerido) debe ser un string con al menos
// 50 caracteres.

db.runCommand({
  collMod: "users",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email", "password"],
      properties: {
        name: {
          bsonType: "string",
          maxLength: 30,
          description: "debe ser un string con un máximo de 30 caracteres",
        },
        email: {
          bsonType: "string",
          pattern: "^(.*)@(.*)\\.(.{2,4})$",
          description:
            'debe ser un string que matchee con la expresión regular: "^(.*)@(.*)\\.(.{2,4})$"',
        },
        password: {
          bsonType: "string",
          minLength: 50,
          description: "debe ser un string con al menos 50 caracteres",
        },
      },
    },
  },
});

// Prueba:
db.users.findOne();

db.users.insertOne({
  name: "Ned Stark",
  email: "sean_beangameofthron.es", // Se saco el @
  password: "$2b$12$UREFwsRUoyF0CRqGNK0LzO0HM/jLhgUCNNIJ9RJAqMUQ74crlJ1Vu",
});

db.users.insertOne({
  name: "abcdefghijklmnoñpqrstuvwxyzáéíó", // 31 caracteres
  email: "abc2@abc.es",
  password: "$2b$12$UREFwsRUoyF0CRqGNK0LzO0HM/jLhgUCNNIJ9RJAqMUQ74crlJ1Vu",
});

db.users.insertOne({
  name: "Ned Stark",
  email: "game@ofthron.es",
  password: "1caracterjajaja", // Menos de 50 caracteres
});

db.users.insertMany([
  {
    name: "Ned Stark", // Deberia entrar
    email: "game@ofthron.es",
    password: "$2b$12$UREFwsRUoyF0CRqGNK0LzO0HM/jLhgUCNNIJ9RJAqMUQ74crlJ1Vu",
  },
  {
    email: "sean@es", // No deberia entrar
    password: "$2b$12$UREFwsRUoyF0CRqGNK0LzO0HM/jLhgUCNNIJ9RJAqMUQ74crlJ1Vu",
  },
]);

// 2. Obtener metadata de la colección users que garantice que las reglas de
// validación fueron correctamente aplicadas.

db.getCollectionInfos(); // De todas

db.getCollectionInfos({ name: "users" }); // De una

// 3. Especificar en la colección theaters las siguientes reglas
// de validación: El campo theaterId (requerido) debe ser un int y
// location (requerido) debe ser un object con:
// 3.a. un campo address (requerido) que sea un object con campos
// street1, city, state y zipcode todos de tipo string y requeridos

db.runCommand({
  collMod: "theaters",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["theaterId", "location"],
      properties: {
        theaterId: {
          bsonType: "int",
          description: "debe ser de tipo int",
        },
        location: {
          bsonType: "object",
          required: ["address"],
          properties: {
            address: {
              bsonType: "object",
              required: ["street1", "city", "state", "zipcode"],
              properties: {
                street1: {
                  bsonType: "string",
                  description: "debe ser un string",
                },
                city: { bsonType: "string", description: "debe ser un string" },
                state: {
                  bsonType: "string",
                  description: "debe ser un string",
                },
                zipcode: {
                  bsonType: "string",
                  description: "debe ser un string",
                },
              },
            },
          },
        },
      },
    },
  },
});

db.theaters.findOne();

db.theaters.insertOne({
  theaterId: 1000,
  location: {
    address: {
      street1: "347 W Market",
      city: "Bloomington",
      state: "MN",
      zipcode: 55425, // No es un str
    },
    geo: {
      type: "Point",
      coordinates: [-93.24565, 44.85466],
    },
  },
});

db.theaters.insertOne({
  // sin theaterId
  location: {
    address: {
      street1: "347 W Market",
      city: "Bloomington",
      state: "MN",
      zipcode: "55425",
    },
    geo: {
      type: "Point",
      coordinates: [-93.24565, 44.85466],
    },
  },
});

db.theaters.insertOne({
  // Este no va
  theaterId: "100s1", // debe ser un int
  location: {
    address: {
      street1: "347 W Market",
      city: "Bloomington",
      state: "MN",
      zipcode: "55425",
    },
    geo: {
      type: "Point",
      coordinates: [-93.24565, 44.85466],
    },
  },
});

db.theaters.insertOne({
  // Este si va
  theaterId: 1001,
  location: {
    address: {
      street1: "347 W Market",
      city: "Bloomington",
      state: "MN",
      zipcode: "55425",
    },
    geo: {
      type: "Point",
      coordinates: [-93.24565, 44.85466],
    },
  },
});

// 3.b. un campo geo (no requerido) que sea un object con un campo
// type, con valores posibles “Point” o null y coordinates que debe
// ser una lista de 2 doubles
// Por último, estas reglas de validación no deben prohibir la
// inserción o actualización de documentos que no las cumplan sino
// que solamente deben advertir.

db.runCommand({
  collMod: "theaters",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["theaterId", "location"],
      properties: {
        theaterId: {
          bsonType: "int",
          description: "debe ser de tipo int",
        },
        location: {
          bsonType: "object",
          required: ["address"],
          properties: {
            geo: {
              bsonType: "object",
              properties: {
                type: {
                  enum: ["Point", null],
                },
                coordinates: {
                  bsonType: "array",
                  minItems: 2,
                  maxItems: 2,
                  items: {
                    bsonType: "double",
                  },
                },
              },
              description:
                "geo es un objeto opcional que puede incluir type y coordinates",
            },
            address: {
              bsonType: "object",
              required: ["street1", "city", "state", "zipcode"],
              properties: {
                street1: {
                  bsonType: "string",
                  description: "debe ser un string",
                },
                city: { bsonType: "string", description: "debe ser un string" },
                state: {
                  bsonType: "string",
                  description: "debe ser un string",
                },
                zipcode: {
                  bsonType: "string",
                  description: "debe ser un string",
                },
              },
            },
          },
        },
      },
    },
  },
  // validationLevel: "moderate", // o "strict", "off"
  validationAction: "warn", // o "error"
});

db.theaters.insertOne({
  // Este si va
  theaterId: 1013,
  location: {
    address: {
      street1: "3417 W Market",
      city: "Bloomington",
      state: "MN",
      zipcode: "122131",
    },
    geo: {
      type: "Point",
      coordinates: [-93.24565, 44.85466],
    },
  },
});

db.theaters.insertOne({
  // Este no va
  theaterId: "1013", // debe ser int
  location: {
    address: {
      street1: "3417 W Market",
      city: "Bloomington",
      state: "MN",
      zipcode: "122131",
    },
    geo: {
      type: "Point",
      coordinates: [-93.24565, 44.85466],
    },
  },
});

db.theaters.insertOne({
  theaterId: 10134,
  location: {
    address: {
      street1: "34117 W Market",
      city: "Bloomington",
      state: "MN",
      zipcode: "12244131",
    },
  },
});

// 4. Especificar en la colección movies las siguientes reglas de
// validación: El campo title (requerido) es de tipo string, year
// (requerido) int con mínimo en 1900 y máximo en 3000, y que tanto
// cast, directors, countries, como genres sean arrays de strings sin
// duplicados.
// Hint: Usar el constructor NumberInt() para especificar valores
// enteros a la hora de insertar documentos. Recordar que mongo shell
// es un intérprete javascript y en javascript los literales numéricos
// son de tipo Number (double).

db.movies.findOne();

db.runCommand({
  collMod: "movies",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "year"],
      properties: {
        title: {
          bsonType: "string",
        },
        year: {
          bsonType: "int",
          minimum: 3000,
          minimum: 1900,
        },
        cast: {
          bsonType: "array",
          uniqueItems: true,
          items: {
            bsonType: "string",
          },
        },
        directors: {
          bsonType: "array",
          uniqueItems: true,
          items: {
            bsonType: "string",
          },
        },
        countries: {
          bsonType: "array",
          uniqueItems: true,
          items: {
            bsonType: "string",
          },
        },
        genres: {
          bsonType: "array",
          uniqueItems: true,
          items: {
            bsonType: "string",
          },
        },
      },
    },
  },
});

db.movies.insertOne({
  // No va
  title: "Inception",
  year: NumberInt(2010), // Usar NumberInt() para asegurar el tipo
  cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page"],
  directors: ["Christopher Nolan"],
  countries: ["USA"],
  genres: ["Action", "Sci-Fi", "Sci-Fi", "Thriller"], // Duplicado
});

db.movies.insertOne({
  // Al parecer anda
  title: "Inception",
  year: 2010, // Sin NumberInt() para asegurar el tipo
  cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page"],
  directors: ["Christopher Nolan"],
  countries: ["USA"],
  genres: ["Action", "Sci-Fi", "Thriller"],
});

db.movies.insertOne({
  title: "Inception",
  year: NumberInt(2010),
  cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page"],
  directors: ["Christopher Nolan"],
  countries: ["USA", "USA"], // Duplicado
  genres: ["Action", "Sci-Fi", "Thriller"],
});

db.movies.insertOne({
  title: 1984, // int
  year: NumberInt(2010),
  cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page"],
  directors: ["Christopher Nolan"],
  countries: ["USA"],
  genres: ["Action", "Sci-Fi", "Thriller"],
});

db.movies.insertOne({
  title: "1984",
  year: "2010", // str
  cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page"],
  directors: ["Christopher Nolan"],
  countries: ["USA"],
  genres: ["Action", "Sci-Fi", "Thriller"],
});

// 5. Crear una colección userProfiles con las siguientes reglas de validación: Tenga
// un campo user_id (requerido) de tipo “objectId”, un campo language (requerido) con
// alguno de los siguientes valores [ “English”, “Spanish”, “Portuguese” ] y un campo
// favorite_genres (no requerido) que sea un array de strings sin duplicados.

db.createCollection("userProfiles", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "language"],
      properties: {
        user_id: {
          bsonType: "objectId",
          description: "",
        },
        language: {
          bsonType: "string",
          enum: ["English", "Spanish", "Portuguese"],
          description: "",
        },
        favorite_genres: {
          bsonType: "array",
          uniqueItems: true,
          description: "",
          items: {
            bsonType: "string",
          },
        },
      },
    },
  },
});

db.userProfiles.insertOne({ // Este va
  user_id: new ObjectId("573a1390f29313caabcd418c"),
  language: "Spanish",
  favorite_genres: ['blues', 'Blues']
});

db.userProfiles.insertOne({ // Este va
  user_id: new ObjectId("573a1390f29313caabcd418c"),
  language: "Spanish",
});

db.userProfiles.insertOne({ // Este no va
  user_id: new ObjectId("573a1a90f29313caabcd418c"),
  language: "Spanish",
  favorite_genres: ['blues', 'blues']
});

db.userProfiles.insertOne({ // Este no va
  user_id: new ObjectId("573a1390f29313caabcd418c"),
  language: "spanish", // sin mayuscula
});

db.userProfiles.insertOne({ // Este no va
  user_id: new ObjectId("573a1390f29313caabcd428c"),
  language: "Espanol", // No forma parte de los enum
});

db.userProfiles.insertOne({ // Este no va
  user_id: "573a1390f29313caabcd411c", // no es un ObjectId
  language: "Spanish",
});

// 6. Identificar los distintos tipos de relaciones (One-To-One, One-To-Many) en las 
// colecciones movies y comments. Determinar si se usó documentos anidados o 
// referencias en cada relación y justificar la razón.

db.getCollectionInfos({ name: "comments" });
db.comments.findOne();

db.comments.aggregate([
  { $project: { fields: { $objectToArray: "$$ROOT" } } },  // Convierte los campos en un array
  { $unwind: "$fields" },                                 // Descompone el array en documentos
  { $group: { _id: null, uniqueFields: { $addToSet: "$fields.k" } } } // Agrupa y obtiene solo los campos únicos
])

// ------------ Estructura movies ------------
// {
//   Validados:
//   "title": "string",        // One-To-One  | documentos anidados
//   "year": "int",            // One-To-One  | documentos anidados
//   "cast": ["string"],       // One-To-Many | documentos anidados
//   "directors": ["string"],  // One-To-Many | documentos anidados
//   "countries": ["string"],  // One-To-Many | documentos anidados
//   "genres": ["string"]      // One-To-Many | documentos anidados
//   No Validados:
//   ...
// }

// documentos anidados: pertenece a la misma collection/documento, no 
// hace referencia a otra

// ------------ Estructura comments ------------
// {
//   "email"    // One-To-One | documentos anidados
//   "date"     // One-To-One | documentos anidados
//   "_id"      // One-To-One | documentos anidados
//   "text"     // One-To-One | documentos anidados
//   "name"     // One-To-One | documentos anidados
//   "movie_id" // One-To-One | referencia
// }