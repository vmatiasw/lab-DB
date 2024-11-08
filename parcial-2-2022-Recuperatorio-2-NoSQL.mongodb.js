db.getCollectionNames();

// 1. Listar el nombre (name) y barrio (borough)
// de todos los restaurantes de cocina
// (cuisine) tipo "Italian" y que entre sus
// notas (grades) tengan al menos una
// entrada con nota (grade) "A" y puntaje (score)
// mayor o igual a 10. La lista final
// sólo deberá mostrar 1 entrada por restaurante
// y deberá estar ordenada de manera
// alfabética por el barrio primero y el nombre
// después. Hint: Revisar operadores
// Sragex v SelemMatch.

// sin pipeline de agregacion:

db.restaurants.findOne();

db.restaurants
  .find(
    {
      cuisine: "Italian",
      grades: { $elemMatch: { grade: "A", score: { $gte: 10 } } },
    },
    {
      name: 1,
      borough: 1,
      _id: 0,
    }
  )
  .sort({ borough: 1, "address.street": 1 });

// con pipeline de agregacion:
db.restaurants.aggregate([
  {
    $match: {
      // PD: match tiene and implicito
      $and: [
        { cuisine: "Italian" },
        { grades: { $elemMatch: { grade: "A", score: { $gte: 10 } } } },
      ],
    },
  },
  {
    $sort: {
      borough: 1,
      "address.street": 1,
    },
  },
  {
    $project: {
      borough: 1,
      name: 1,
      _id: 0,
    },
  },
]);

db.restaurants.findOne();

// Para que todos cumplan la condicion:
db.restaurants.aggregate([
  {
    $match: {
      cuisine: "Italian", // Filtrar restaurantes italianos
      grades: {
        // Todos los elementos en grades deben cumplir la condición
        $not: {
          $elemMatch: {
            grade: { $ne: "A" }, // Que no haya entradas que no sean "A"
            score: { $lt: 10 }, // Y que no haya entradas con score menor a 10
          },
        },
      },
    },
  },
  {
    $project: {
      name: 1, // Incluir el nombre del restaurante
      borough: 1, // Incluir el barrio
      _id: 0, // Excluir el campo _id
    },
  },
  {
    $sort: {
      borough: 1, // Ordenar primero por el barrio (alfabéticamente)
      name: 1, // Luego por el nombre del restaurante (alfabéticamente)
    },
  },
]);

// Para que N cumplan la condicion:
db.restaurants.aggregate([
  {
    $match: {
      cuisine: "Italian",
    },
  },
  {
    $addFields: {
      validGradesCount: {
        $size: {
          $filter: {
            input: "$grades", // Accede al array grades
            as: "grade", // Cada entrada del array se llama "grade"
            cond: {
              // Condición que cada entrada debe cumplir
              $and: [
                { $eq: ["$$grade.grade", "A"] }, // La nota debe ser "A"
                { $gte: ["$$grade.score", 10] }, // El puntaje debe ser mayor o igual a 10
              ],
            },
          },
        },
      },
    },
  },
  {
    $match: {
      validGradesCount: N, // Filtra aquellos con exactamente N elementos válidos en grades
    },
  },
  {
    $project: {
      name: 1, // Incluir el nombre del restaurante
      borough: 1, // Incluir el barrio
      _id: 0, // Excluir el campo _id
    },
  },
  {
    $sort: {
      borough: 1, // Ordenar primero por el barrio (alfabéticamente)
      name: 1, // Luego por el nombre del restaurante (alfabéticamente)
    },
  },
]);

// 2. Actualizar las panaderías (cuisine - Bakery)
//  y las cafeterías (cuisine -
//   Coffee) agregando un nuevo campo discounts
//   que sea un objeto con dos campos:
//   day y amount. Si el local se ubica en
//   Manhattan, el día será "Monday" y el
//   descuento será "210". En caso contrario el
//   día será "Tuesday" y el descuento será
//   "5%". Hint: Revisar el operador $cond.

db.getCollectionNames();
db.restaurants.findOne();

// Sin pipeline:
const casoManhattan = { day: "Tuesday", amount: 0.05 };
const casoXDefecto = { day: "Monday", amount: 0.21 };
db.restaurants.updateMany(
  { cuisine: { $in: ["Bakery", "Coffee"] }, borough: "Manhattan" },
  { $set: { discounts: casoManhattan } }
);
db.restaurants.updateMany(
  { cuisine: { $in: ["Bakery", "Coffee"] }, borough: { $ne: "Manhattan" } },
  { $set: { discounts: casoXDefecto } }
);

// Con pipeline:
casoManhattan = { day: "Tuesday", amount: 0.05 };
casoXDefecto = { day: "Monday", amount: 0.21 };
db.restaurants.updateMany({ cuisine: { $in: ["Bakery", "Coffee"] } }, [
  {
    $set: {
      discounts: {
        $cond: {
          if: { $eq: ["$borough", "Manhattan"] },
          then: casoManhattan,
          else: casoXDefecto,
        },
      },
    },
  },
]);

casoManhattan = { day: "Tuesday", amount: 0.05 };
casoXDefecto = { day: "Monday", amount: 0.21 };
db.restaurants.updateMany({ cuisine: { $in: ["Bakery", "Coffee"] } }, [
  {
    $addFields: {
      discounts: {
        $cond: {
          if: { $eq: ["$borough", "Manhattan"] },
          then: casoManhattan,
          else: casoXDefecto,
        },
      },
    },
  },
]);

casoManhattan = { day: "Tuesday", amount: 0.05 };
casoXDefecto = { day: "Monday", amount: 0.21 };
db.restaurants.aggregate([
  {
    $match: {
      cuisine: { $in: ["Bakery", "Coffee"] },
    },
  },
  {
    $set: {
      discounts: {
        $cond: {
          if: { $eq: ["$borough", "Manhattan"] },
          then: casoManhattan,
          else: casoXDefecto,
        },
      },
    },
  },
  {
    $merge: {
      into: "restaurants",
      on: "_id",
      whenMatched: "merge",
      whenNotMatched: "discard",
    },
  },
]);

// $merge escribe los resultados nuevamente
// en la colección restaurants, actualizando
// solo los documentos que coinciden
// (whenMatched: "merge") y descartando aquellos
// que no existen (whenNotMatched: "discard").

db.restaurants.findOne({
  borough: "Manhattan",
  cuisine: { $in: ["Bakery", "Coffee"] },
});

// 3. Contar la cantidad de restaurantes
// cuyo address .zipcode se encuentre entre
// 10000 y 11000. Tener en cuenta que el valor
// original es un string y deberá ser
// convertido. También tener en cuenta que hay
// casos erróneos que no pueden ser
// convertidos a número, en cuyo caso el valor
// será reemplazado por 0. Hint: Revisar
// el operador $convert.

// {
//   $convert: {
//     input: <expresión que define el campo a convertir>,
//     to: <tipo al que se convertirá>,
//     onError: <valor en caso de error>,     // Opcional
//     onNull: <valor en caso de valor null>  // Opcional
//   }
// }

// Sin pipeline:
// Si todos los datos estuvieran bien:
db.restaurants
  .find({
    $expr: {
      $and: [
        { $gte: [{ $toInt: "$address.zipcode" }, 10000] },
        { $lte: [{ $toInt: "$address.zipcode" }, 11000] },
      ],
    },
  })
  .count();

db.restaurants
  .find({
    $expr: {
      $and: [
        {
          $gte: [
            {
              $convert: {
                input: "$address.zipcode",
                to: "int",
                onError: 0,
              },
            },
            10000,
          ],
        },
        {
          $lte: [
            {
              $convert: {
                input: "$address.zipcode",
                to: "int",
                onError: 0,
              },
            },
            11000,
          ],
        },
      ],
    },
  })
  .count();

// Con pipeline:

db.restaurants.aggregate([
  {
    $addFields: {
      "address.zipcode": {
        // Esta etapa agrega o modifica campos en cada documento del pipeline.
        $convert: {
          input: "$address.zipcode", // Referencia al campo a convertir
          to: "int", // Tipo de dato al que quieres convertir
          onError: 0, // Valor en caso de error
          onNull: 0, // Valor si el campo es null
        },
      },
    },
  },
  {
    $match: {
      "address.zipcode": { $gte: 10000, $lte: 11000 },
    },
  },
  {
    // cuenta todos los documentos  en esta fase del pipeline
    $count: "total_match",
  },
]);

// 4. Por cada tipo de cocina (cuisine), contar
// la cantidad de notas distintas recibidas
// (grades.grade) en el segundo semestre de 2013.
// Ordenar por tipo de cocina y nota.
db.restaurants.findOne();
db.restaurants.aggregate([
  {
    $unwind: {
      path: "$grades",
      preserveNullAndEmptyArrays: false,
    },
  },
  {
    $match: {
      $expr: {
        $and: [
          { $eq: [{ $year: "$grades.date" }, 2013] },
          { $gte: [{ $month: "$grades.date" }, 7] }, // Meses de julio a diciembre
        ],
      },
    },
  },
  {
    $group: {
      _id: { grade: "$grades.grade", cuisine: "$cuisine" },
      numero: { $sum: 1 },
    },
  },
]);

// EJ eliminar duplicados:
db.restaurants.aggregate([
  {
    $group: {
      _id: "$name", // Agrupa por el campo 'name'
      firstRestaurant: { $first: "$$ROOT" }, // Selecciona el primer documento de cada grupo
    },
  },
  {
    $replaceRoot: { newRoot: "$firstRestaurant" }, // Reemplaza el documento con el primer restaurante de cada grupo
  },
]);

// Usar distinct para Obtener Documentos Únicos
db.restaurants.distinct("name");

// 5. Data la siguiente tabla de conversión
// de notas (grades.grade):
// A -> 5 | B -> 4 | C -> 3 | D -> 2 | * -> 1
// Donde "*" sería el resto de los casos
// posibles. Transformar las notas de los
// restaurantes de acuerdo a la tabla. Luego,
// calcular la nota promedio, máxima y
// mínima por tipo de cocina (cuisine). El
// resultado final deberá mostrar la cocina, la
// nota promedio, la nota máxima y la nota
// mínima, ordenadas de manera descendente
// por la nota promedio. Hint: Revisar el
// operador $switch
db.restaurants.findOne();

db.restaurants.aggregate([
  {
    $unwind: {
      path: "$grades",
      preserveNullAndEmptyArrays: false,
    },
  },
  {
    $set: {
      "grades.score": {
        //$expr: {
        $switch: {
          branches: [
            { case: { $eq: ["$grades.grade", "A"] }, then: 5 },
            { case: { $eq: ["$grades.grade", "B"] }, then: 4 },
            { case: { $eq: ["$grades.grade", "C"] }, then: 3 },
            { case: { $eq: ["$grades.grade", "D"] }, then: 2 },
          ],
          default: 1,
        },
        //},
      },
    },
  },
  {
    $group: {
      _id: "$cuisine",
      promedio: { $avg: "$grades.score" },
      maxima: { $max: "$grades.score" },
      minima: { $min: "$grades.score" },
    },
  },
  {
    $sort: {
      promedio: -1,
    },
  },
]);

// 6. Especificar reglas de validación para la colección
// restaurant utilizando JSON
// Schema. Tener en cuenta los campos: address (con sus
//   campos anidados),
// borough, cuisine, grades (con sus campos anidados),
// name, restaurant_id, y
// discount (con sus campos anidados). Inferir tipos y
// otras restricciones que considere
// adecuadas (incluyendo campos requeridos). Agregar una
// regla de validación para
// que el zipcode, aún siendo un string, verifique que
// el rango esté dentro de lo
// permitido para New York City (i.e. 10001-11697).
// Finalmente dejar 2 casos de falla
// ante el esquema de validación y 1 caso de éxito.
// Hint: Deberán hacer conversión
// con $convert en el caso de la regla de validación.
// Los casos no deben ser triviales
// (i.e. sólo casos de falla por un error de tipos).
db.restaurants.findOne();

db.runCommand({
  collMod: "restaurants",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "address",
        "borough",
        "cuisine",
        "grades",
        "name",
        "restaurant_id",
        "discount",
      ],
      properties: {
        address: {
          bsonType: "object",
          required: ["building", "coord", "street", "zipcode"],
          properties: {
            building: { bsonType: "string" },
            coord: {
              bsonType: "array",
              minItems: 2,
              maxItems: 2,
              items: {
                bsonType: "double",
              },
            },
            street: { bsonType: "string" },
            zipcode: { bsonType: "string" },
          },
        },
        borough: { bsonType: "string" },
        cuisine: { bsonType: "string" },
        grades: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["date", "grade", "score"],
            properties: {
              date: { bsonType: "date" },
              grade: { bsonType: "string" },
              score: { bsonType: "int" },
            },
          },
        },
        name: { bsonType: "string" },
        restaurant_id: { bsonType: "string" },
        discount: {
          bsonType: "object",
          required: ["day", "amount"],
          properties: {
            day: { bsonType: "string" },
            amount: { bsonType: "int" },
          },
        },
      },
    },
  },
  validationLevel: "strict", // Nivel de validación: strict, moderate, off
  validationAction: "error", // Acción: error (rechazar documento) o warn (advertir)
});

// dependencies es una palabra clave en JSON Schema
// que permite aplicar reglas adicionales basadas en
// la presencia de un campo.

// oneOf permite definir múltiples condiciones posibles,
// donde solo una debe ser verdadera para que la
// validación pase.
db.restaurants.insertOne({
  // va
  address: {
    building: "123",
    coord: [40.7128, -74.006],
    street: "Main Street",
    zipcode: "10001",
  },
  borough: "Manhattan",
  cuisine: "Italian",
  grades: [
    {
      date: ISODate("2013-07-01T00:00:00Z"),
      grade: "A",
      score: 5,
    },
    {
      date: ISODate("2013-12-15T00:00:00Z"),
      grade: "B",
      score: 4,
    },
  ],
  name: "Pasta Paradise",
  restaurant_id: "0001",
  discount: {
    day: "Monday",
    amount: 10,
  },
});

db.restaurants.insertOne({
  // no va
  address: {
    building: "123",
    coord: [40.7128, -74.006],
    street: "Main Street",
    zipcode: "10001",
  },
  borough: "Manhattan",
  cuisine: "Italian",
  grades: [
    {
      date: ISODate("2013-07-01T00:00:00Z"),
      // "grade": "A",
      score: 5,
    },
    {
      date: ISODate("2013-12-15T00:00:00Z"),
      grade: "B",
      score: 4,
    },
  ],
  name: "Pasta Paradise",
  restaurant_id: "0001",
  discount: {
    day: "Monday",
    amount: 10,
  },
});

db.restaurants.insertOne({
  // no va
  address: {
    building: "123",
    coord: [40.7128, -74.006],
    street: "Main Street",
    zipcode: "10001",
  },
  borough: "Manhattan",
  cuisine: "Italian",
  grades: [
    {
      date: "2013-07-01T00:00:00Z",
      grade: "A",
      score: 5,
    },
    {
      date: ISODate("2013-12-15T00:00:00Z"),
      grade: "B",
      score: 4,
    },
  ],
  name: "Pasta Paradise",
  restaurant_id: "0001",
  discount: {
    day: "Monday",
    amount: 10,
  },
});

// 7. Se desean agregar "client reviews", dados por los
// clientes de los restaurantes. Los
// reviews cuentan de un título de menos de 50 caracteres,
//  un puntaje entero entre 0 y
// 5, una reseña de máximo 250 caracteres (que es opcional)
//  y una fecha y un cliente
// que lo realizó (con información de nombre y correo
//    electrónico del cliente). Cada
// review está asociado a un restaurante y un mismo
// restaurante puede tener varios
// reviews. Asimismo, un cliente puede hacer reviews de
// varios restaurantes distintos.
// Teniendo en cuenta esto, decida la mejor manera de
// agregar esta información a la
// base de datos (y justifique su decisión en un
//   comentario), genere un esquema de
// validación para dicha información y agregue algunos
//  documentos de ejemplo.

db.createCollection("clients", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nombre", "email"],
      properties: {
        nombre: {
          bsonType: "string",
        },
        email: {
          bsonType: "string",
          pattern: "^(.*)@(.*)\\.(.{2,4})$",
        },
        client_id: {
          bsonType: "objectId",
        },
      },
    },
  },
  validationLevel: "strict", // Niveles: strict, moderate, off
  validationAction: "error", // Acciones: error, warn
});

db.clients.drop();

db.runCommand({
  collMod: "restaurants",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "address",
        "borough",
        "cuisine",
        "grades",
        "name",
        "restaurant_id",
        "discount",
      ],
      properties: {
        // Opcionales:
        reviews: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["client_id", "titulo", "date", "score"],
            properties: {
              client_id: { bsonType: "objectId" },
              review: { bsonType: "string", maxLength: 250 },
              titulo: { bsonType: "string", maxLength: 50 },
              date: { bsonType: "date" },
              score: { bsonType: "int", maximum: 5, minimum: 0 },
            },
          },
        },

        // Requeridos:
        address: {
          bsonType: "object",
          required: ["building", "coord", "street", "zipcode"],
          properties: {
            building: { bsonType: "string" },
            coord: {
              bsonType: "array",
              minItems: 2,
              maxItems: 2,
              items: {
                bsonType: "double",
              },
            },
            street: { bsonType: "string" },
            zipcode: { bsonType: "string" },
          },
        },
        borough: { bsonType: "string" },
        cuisine: { bsonType: "string" },
        grades: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["date", "grade", "score"],
            properties: {
              date: { bsonType: "date" },
              grade: { bsonType: "string" },
              score: { bsonType: "int" },
            },
          },
        },
        name: { bsonType: "string" },
        restaurant_id: { bsonType: "string" },
        discount: {
          bsonType: "object",
          required: ["day", "amount"],
          properties: {
            day: { bsonType: "string" },
            amount: { bsonType: "int" },
          },
        },
      },
    },
  },
  validationLevel: "strict", // Nivel de validación: strict, moderate, off
  validationAction: "error", // Acción: error (rechazar documento) o warn (advertir)
});

db.clients.insertOne({
  nombre: "Juan",
  email: "Juam@gmail.com",
  client_id: ObjectId()
});

db.restaurants.findOne()

const clientId = db.clients.findOne({ nombre: "Juan" }).client_id;
db.restaurants.insertOne({
  // va
  address: {
    building: "123",
    coord: [40.7128, -74.006],
    street: "Main Street",
    zipcode: "10001",
  },
  borough: "Manhattan",
  cuisine: "Italian",
  reviews: [
    {
      client_id: clientId,
      review: "re feo",
      titulo: "re feo",
      date: ISODate("2014-03-03T00:00:00Z"),
      score: 0
    },
  ],
  grades: [
    {
      date: ISODate("2013-07-01T00:00:00Z"),
      grade: "A",
      score: 5,
    },
    {
      date: ISODate("2013-12-15T00:00:00Z"),
      grade: "B",
      score: 4,
    },
  ],
  name: "Pasta Paradise",
  restaurant_id: "0001",
  discount: {
    day: "Monday",
    amount: 10,
  },
});

clientId = db.clients.findOne({ nombre: "Juan" }).client_id;
db.restaurants.insertOne({
  // va
  address: {
    building: "123",
    coord: [40.7128, -74.006],
    street: "Main Street",
    zipcode: "10001",
  },
  borough: "Manhattan",
  cuisine: "Italian",
  reviews: [
    {
      client_id: clientId,
      titulo: "re feo",
      date: ISODate("2014-03-03T00:00:00Z"),
      score: 0
    },
  ],
  grades: [
    {
      date: ISODate("2013-07-01T00:00:00Z"),
      grade: "A",
      score: 5,
    },
    {
      date: ISODate("2013-12-15T00:00:00Z"),
      grade: "B",
      score: 4,
    },
  ],
  name: "Pasta Paradise",
  restaurant_id: "0001",
  discount: {
    day: "Monday",
    amount: 10,
  },
});

clientId = db.clients.findOne({ nombre: "Juan" }).client_id;
db.restaurants.insertOne({
  // no va
  address: {
    building: "123",
    coord: [40.7128, -74.006],
    street: "Main Street",
    zipcode: "10001",
  },
  borough: "Manhattan",
  cuisine: "Italian",
  reviews: [
    {
      client_id: clientId,
      review: "re feo",
      date: ISODate("2014-03-03T00:00:00Z"),
      score: 0
    },
  ],
  grades: [
    {
      date: ISODate("2013-07-01T00:00:00Z"),
      grade: "A",
      score: 5,
    },
    {
      date: ISODate("2013-12-15T00:00:00Z"),
      grade: "B",
      score: 4,
    },
  ],
  name: "Pasta Paradise",
  restaurant_id: "0001",
  discount: {
    day: "Monday",
    amount: 10,
  },
});
