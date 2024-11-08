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
    $match: {},
  },
]);
