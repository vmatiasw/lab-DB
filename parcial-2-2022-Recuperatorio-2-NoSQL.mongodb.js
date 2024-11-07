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

db.restaurants.aggregate([
  {
    $match: {
      // match tiene and implicito
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
