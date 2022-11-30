const express = require('express');
const { Pool } = require('pg');

// Observar passagem por variáveis de ambiente
const PORT = 3333;
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'todo_teste',
    password: 'root',
    port: '5432'
})

const app = express();
app.use(express.json());

// Get para usuários
app.get('/usuarios', async (req, res) => {
    try {
        const usuarios = await pool.query(
            `SELECT * FROM usuarios`
        )
        return res.status(200).send(usuarios.rows);
    } catch (error) {
        return res.status(500).send(error);

    }
});

// Post para usuários
app.post('/sessao', async (req, res) => {
    const { nome_usuario } = req.body
    let user = ''
    try {
        user = await pool.query(`SELECT * FROM usuarios WHERE nome_usuario = ($1)`, [nome_usuario]);
        if (!user.rows[0]) {
            user = await pool.query(
                `INSERT INTO usuarios(nome_usuario) VALUES ($1) RETURNING *`, [nome_usuario]
            )
        }
        return res.status(201).send(user.rows);
    } catch (error) {
        return res.status(500).send(error);

    }
})

//Busca agenda por usuário
app.get('/agenda/:id_usuario', async (req, res) => {
    const { id_usuario } = req.params;
    try {
        const todasAgendas = await pool.query(
            `SELECT * FROM agenda WHERE id_usuario = ($1)`, [id_usuario]
        );
        return res.status(200).send(todasAgendas.rows)
    } catch (error) {
        return res.status(500).send(error);

    }
})

// Post para agenda passando o usuário
app.post('/agenda/:id_usuario', async (req, res) => {
    const { descricao_agenda, concluido } = req.body;
    const { id_usuario } = req.params;
    //Validar id
    try {
        const validaUsuario = await pool.query(`SELECT * FROM usuarios WHERE id_usuario = ($1)`, [id_usuario])
        if (validaUsuario.rows.length === 0) { return res.status(400).send({ menssagem: "Operação inválida" }); }
        const novaAgenda = await pool.query(
            `INSERT INTO agenda (descricao_agenda, concluido, id_usuario)
                        VALUES ($1,$2,$3)
                        RETURNING * `,
            [descricao_agenda, concluido, id_usuario]);
        return res.status(201).send(novaAgenda.rows)

    } catch (error) {
        return res.status(500).send(error);

    }

})

// Alterando agenda de um usuário 
app.patch('/agenda/:id_usuario/:id_agenda', async (req, res) => {
    const { id_usuario, id_agenda } = req.params;
    const data = req.body;
    try {
        const existeUsuario = await pool.query(`SELECT * FROM agenda WHERE id_usuario = ($1)
        AND id_agenda = ($2)`, [id_usuario, id_agenda]);
        if (!existeUsuario.rows[0]) { return res.status(400).send("Operação não permitida") }
        const atualizaAgenda = await pool.query(
            `UPDATE agenda SET descricao_agenda = ($1),
                                concluido = ($2)
                                WHERE id_agenda = ($3) RETURNING *`
            , [data.descricao_agenda, data.concluido, id_agenda]);
        return res.status(202).send(atualizaAgenda.rows)

    } catch (error) {
        return res.status(500).send(error);

    }
})


// Deletando agenda de um usuário 

app.delete('/agenda/:id_usuario/:id_agenda', async (req, res) => {
    const { id_usuario, id_agenda } = req.params;
    try {
        const existeUsuario = await pool.query(`SELECT * FROM agenda WHERE id_usuario = ($1)
        AND id_agenda = ($2)`, [id_usuario, id_agenda]);
        if (!existeUsuario.rows[0]) { return res.status(400).send("Operação não permitida !") }
        const deleteAgenda = await pool.query(
            `DELETE FROM agenda WHERE id_agenda = ($1) RETURNING *`
            , [id_agenda]);
        return res.status(202).send({
            mensagem: "Agenda deletada com sucesso",
            agendaDeletada: deleteAgenda.rows
        })

    } catch (error) {
        return res.status(500).send(error);

    }
})

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));