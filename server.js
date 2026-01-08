const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(express.static('views'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/api/colaboradores', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('colaboradores')
            .select(`
                *,
                empresas (
                    id,
                    nome
                )
            `)
            .order('nome_completo');
        
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/colaboradores', async (req, res) => {
    try {
        const colaborador = {
            nome_completo: req.body.nome_completo,
            re: req.body.re,
            cargo: req.body.cargo,
            salario_atual: req.body.salario_atual,
            empresa_id: req.body.empresa_id,
            salario_anterior: null,
            status: 'Ativo',
            data_admissao: new Date().toISOString().split('T')[0]
        };
        
        const { data, error } = await supabase
            .from('colaboradores')
            .insert([colaborador])
            .select(`
                *,
                empresas (
                    id,
                    nome
                )
            `);
        
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/colaboradores/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('colaboradores')
            .update({
                nome_completo: req.body.nome_completo,
                re: req.body.re,
                cargo: req.body.cargo,
                salario_atual: req.body.salario_atual,
                empresa_id: req.body.empresa_id,
                status: req.body.status
            })
            .eq('id', req.params.id)
            .select(`
                *,
                empresas (
                    id,
                    nome
                )
            `);
        
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/colaboradores/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        
        const { data, error } = await supabase
            .from('colaboradores')
            .update({ 
                status: status,
                data_desativacao: status === 'Inativo' ? new Date().toISOString().split('T')[0] : null
            })
            .eq('id', req.params.id)
            .select(`
                *,
                empresas (
                    id,
                    nome
                )
            `);
        
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/colaboradores/:id/reajuste', async (req, res) => {
    try {
        const { percentual, bonus } = req.body;
        
        const { data: colaborador, error: fetchError } = await supabase
            .from('colaboradores')
            .select('*')
            .eq('id', req.params.id)
            .single();
        
        if (fetchError) throw fetchError;
        
        let novoSalario = colaborador.salario_atual * (1 + percentual / 100);
        
        if (colaborador.salario_atual < 1500 && bonus) {
            novoSalario += bonus;
        }
        
        const { data: updatedColab, error: updateError } = await supabase
            .from('colaboradores')
            .update({
                salario_anterior: colaborador.salario_atual,
                salario_atual: novoSalario
            })
            .eq('id', req.params.id)
            .select(`
                *,
                empresas (
                    id,
                    nome
                )
            `);
        
        if (updateError) throw updateError;
        
        res.json({ 
            success: true, 
            novoSalario: novoSalario,
            salarioAnterior: colaborador.salario_atual,
            colaborador: updatedColab[0]
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/empresas', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('empresas')
            .select('*')
            .order('nome');
        
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando: http://localhost:${PORT}`);
});