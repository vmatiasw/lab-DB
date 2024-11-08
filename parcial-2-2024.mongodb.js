// 1. Buscar los documentos donde el alumno tiene:
// (i) un puntaje mayor o igual a 80  en "exam"
// o bien un puntaje mayor o igual a 90 en "quiz" y
// (ii) un puntaje mayor o igual a 60 en todos
// los "homework" (en otras palabras no tiene un
//     puntaje menor a 60 en algún "homework")
// Se debe mostrar todos los campos excepto el _id,
// ordenados por el id de la clase y id del alumno en
//  orden descendente y ascendente respectivamente..

db.grades.aggregate([
  {
    $set: { minScore: { $min: "$scores.score" } },
  },
  {
    $match: {
      $or: [
        { "scores.type": "exam", "scores.score": { $gte: 80 } },
        { "scores.type": "quiz", "scores.score": { $gte: 90 } },
      ],
      "scores.type": "homework",
      minScore: { $gte: 60 },
    },
  },
  {
    $project: {
      _id: 0,
      minScore: 0,
    },
  },
  {
    $sort: {
      student_id: 1,
      class_id: -1,
    },
  },
]);

// 2. Calcular el puntaje mínimo, promedio, y máximo que
// obtuvo el alumno en las clases 20, 220, 420.
// El resultado debe mostrar además el id de la clase
// y el id del alumno, ordenados por alumno y clase en
// orden ascendentes.

db.grades.aggregate([
  {
    $match: {
      class_id: { $in: [20, 220, 420] },
    },
  },
  {
    $unwind: {
      path: "$scores",
      preserveNullAndEmptyArrays: false,
    },
  },
  {
    $group: {
      _id: {
        class_id: "$class_id",
        student_id: "$student_id",
        cursada_id: "$_id",
      },
      maximo: { $max: "$scores.score" },
      minimo: { $min: "$scores.score" },
      promedio: { $avg: "$scores.score" },
    },
  },
  {
    $project: {
      "_id.cursada_id": 0,
    },
  },
  {
    $sort: {
      "_id.student_id": 1,
      "_id.class_id": 1,
    },
  },
]);

// 3. Para cada clase listar el puntaje máximo de las
// evaluaciones de tipo "exam" y el puntaje máximo
// de las evaluaciones de tipo "quiz". Listar en
// orden ascendente por el id de la clase. HINT:
// El operador $filter puede ser de utilidad.

db.grades.aggregate([
  {
    $unwind: {
      path: "$scores",
      preserveNullAndEmptyArrays: false,
    },
  },
  {
    $match: {
      "scores.type": { $in: ["exam", "quiz"] },
    },
  },
  {
    $group: {
      _id: { class_id: "$class_id", type: "$scores.type" },
      maximo: { $max: "$scores.score" },
    },
  },
  {
    $sort: {
      "_id.class_id": 1,
    },
  },
]);

// 4. Crear una vista "top10students" que liste los 10
// estudiantes con los mejores promedios.

db.top10students.find();

db.top10students.find().count();

db.createView("top10students", "grades", [
  {
    $unwind: {
      path: "$scores",
      preserveNullAndEmptyArrays: false,
    },
  },
  {
    $group: {
      _id: {
        student_id: "$student_id",
      },
      promedio: { $avg: "$scores.score" },
    },
  },
  {
    $sort: {
      promedio: -1,
    },
  },
  { $limit: 10 },
]);

// 5. Actualizar los documentos de la clase 339,
// agregando dos nuevos campos: el campo "score_avg"
// que almacena el puntaje promedio y el campo "letter"
// que tiene el
// valor "NA" si el puntaje promedio está entre [0, 60),
// el valor "A" si el puntaje promedio está entre
// [60, 80)
// y el valor "P" si el puntaje promedio está entre
// [80, 100].
// HINTS: (i) para actualizar se puede usar pipeline de
// agregación. (ii) El operador $cond o $switch pueden
// ser de utilidad.

db.grades.updateMany({ class_id: 339 }, [
  {
    $set: {
      score_avg: { $avg: "$scores.score" },
    },
  },
  {
    $set: {
      letter: {
        $switch: {
          branches: [
            {
              case: {
                $and: [
                  { $gte: ["$score_avg", 0] },
                  { $lt: ["$score_avg", 60] },
                ],
              },
              then: "NA",
            },
            {
              case: {
                $and: [
                  { $gte: ["$score_avg", 60] },
                  { $lt: ["$score_avg", 80] },
                ],
              },
              then: "A",
            },
            {
              case: {
                $and: [
                  { $gte: ["$score_avg", 80] },
                  { $lte: ["$score_avg", 100] },
                ],
              },
              then: "P",
            },
          ],
          default: null,
        },
      },
    },
  },
]);

db.grades.findOne({
  // Test:
  $or: [
    { letter: { $ne: "NA" }, score_avg: { $lt: 60 } },
    { letter: { $ne: "A" }, score_avg: { $lt: 60, $gte: 80 } },
    { letter: { $ne: "P" }, score_avg: { $gte: 80 } },
    { score_avg: { $lt: 0 } },
    { score_avg: { $gt: 100 } },
    { class_id: 339, score_avg: { $exists: false } },
    { class_id: 339, letter: { $exists: false } },
    { class_id: { $ne: 339 }, score_avg: { $exists: true } },
    { class_id: { $ne: 339 }, letter: { $exists: true } },
  ],
});

// 6. (a) Especificar reglas de validación en la colección
// grades para todos sus campos y subdocumentos anidados.
// Inferir los tipos y otras restricciones que considere
// adecuados para especificar las reglas a partir de los
// documentos de la colección.
// (b) Testear la regla de validación generando dos casos
// de fallas en la regla de validación y un caso de éxito
// en la regla de validación. Aclarar en la entrega
// cuales son los casos y por qué fallan y cuales
// cumplen la regla de validación. Los casos no deben
// ser triviales, es decir los ejemplos deben contener
// todos los campos..

// Todo sera requerido para poder asumir que los
// datos nuevos de la db estan completos y tienen todos
// los campos que se podrian necesitar.
// menos score_avg y letter ya que se pidio solo
// para una clase

// Adicionalmente se podria agregar que:
// [x] los tipos
// [] score_avg y letter correspondan si existen
// [x] 0 <= score <= 100
// [] type sea "exam", ....

db.runCommand({
  collMod: "grades",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["student_id", "scores", "class_id"],
      properties: {
        student_id: { bsonType: "int" },
        scores: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["type", "score"],
            properties: {
              type: { bsonType: "string" },
              score: { bsonType: "double", minimum: 0, maximum: 100 },
            },
          },
        },
        class_id: { bsonType: "int" },
        score_avg: { bsonType: "double" },
        letter: { bsonType: "string" },
      },
    },
  },
  validationLevel: "strict", // para que pida mofiifcar los datos viejos si estan mal y se quieren modificar
  validationAction: "error", // para que de error ante datos invalidos
});

db.grades.findOne({ student_id: 100000 });

db.grades.insertOne({
  // correcto
  student_id: 100000,
  scores: [
    {
      type: "exam",
      score: 78.40446309504266,
    },
    {
      type: "quiz",
      score: 73.36224783231339,
    },
    {
      type: "homework",
      score: 46.980982486720535,
    },
    {
      type: "homework",
      score: 76.67556138656222,
    },
  ],
  class_id: 339,
  score_avg: 68.8558137001597,
  letter: "A",
});

db.grades.insertOne({
  // correcto
  student_id: 100000,
  scores: [
    {
      type: "exam",
      score: 78.40446309504266,
    },
    {
      type: "quiz",
      score: 73.36224783231339,
    },
    {
      type: "homework",
      score: 46.980982486720535,
    },
    {
      type: "homework",
      score: 76.67556138656222,
    },
  ],
  class_id: 339,
  // estos campos son opcionales
});

db.grades.insertOne({
  // Incorrecto
  student_id: 100000,
  scores: [
    {
      type: "exam",
      score: 78.40446309504266,
    },
    {
      type: "quiz",
      score: 73.36224783231339,
    },
    {
      type: "homework",
      score: 46.980982486720535,
    },
    {
      type: "homework",
      score: 76.67556138656222,
    },
  ],
  class_id: 339,
  score_avg: 68.8558137001597,
  letter: 1, // deberia ser str
});

db.grades.insertOne({
  // Incorrecto
  student_id: "100000", // deberia ser int
  scores: [
    {
      type: "exam",
      score: 78.40446309504266,
    },
    {
      type: "quiz",
      score: 73.36224783231339,
    },
    {
      type: "homework",
      score: 46.980982486720535,
    },
    {
      type: "homework",
      score: 76.67556138656222,
    },
  ],
  class_id: 339,
  score_avg: 68.8558137001597,
  letter: "A",
});

db.grades.insertOne({
  // Incorrecto
  student_id: 100000,
  scores: [
    {
      type: "exam",
      score: 100.1, // no deberia ser mayor a 100
    },
    {
      type: "quiz",
      score: 73.36224783231339,
    },
    {
      type: "homework",
      score: 46.980982486720535,
    },
    {
      type: "homework",
      score: 76.67556138656222,
    },
  ],
  class_id: 339,
  score_avg: 68.8558137001597,
  letter: "A",
});
