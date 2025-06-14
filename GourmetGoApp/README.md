

-- usuarios
\d usuarios

-- experiencias
\d experiencias

-- reservas
\d reservas

-- ratings
\d ratings


SELECT *         
FROM   usuarios
ORDER  BY id DESC
LIMIT  3;+

SELECT *         
FROM   reservas
ORDER  BY id DESC
LIMIT  3;

SELECT *         
FROM   experiencias
ORDER  BY id DESC
LIMIT  3;+
