import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';

dotenv.config();

const app = express();
const __dirname = path.resolve();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/empresa-padrao', async (req, res) => {
  const { data, error } = await supabase
    .from('empresas')
    .select('id, nome')
    .limit(1)
    .single();

  if (error) {
    return res.status(500).json({ message: 'Nenhuma empresa cadastrada' });
  }

  res.json(data);
});

app.get('/colaboradores', async (req, res) => {
  const { data, error } = await supabase
    .from('colaboradores')
    .select('*, empresas(nome)')
    .order('id');

  if (error) return res.status(500).json(error);
  res.json(data);
});

app.post('/colaboradores', async (req, res) => {
  try {
    const { nome_completo, re, cargo, salario_atual } = req.body;

    if (!nome_completo || !re || !cargo || !salario_atual) {
      return res.status(400).json({ message: 'Campos obrigatórios ausentes' });
    }

    const { data: empresa } = await supabase
      .from('empresas')
      .select('id')
      .limit(1)
      .single();

    if (!empresa) {
      return res.status(400).json({ message: 'Nenhuma empresa cadastrada' });
    }

    const { data, error } = await supabase.from('colaboradores').insert([{
      nome_completo,
      re,
      cargo,
      salario_atual,
      salario_anterior: salario_atual,
      empresa_id: empresa.id
    }]).select();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ message: 'RE já cadastrado' });
      }
      return res.status(500).json(error);
    }

    res.json({ message: 'INSERIU', data });
  } catch {
    res.status(500).json({ message: 'Erro interno' });
  }
});

app.put('/colaboradores/:id', async (req, res) => {
  const { nome_completo, cargo, salario_atual } = req.body;

  const { error } = await supabase
    .from('colaboradores')
    .update({
      nome_completo,
      cargo,
      salario_atual,
      updated_at: new Date()
    })
    .eq('id', req.params.id);

  if (error) return res.status(500).json(error);
  res.json({ message: 'Colaborador atualizado' });
});

app.put('/colaboradores/:id/status', async (req, res) => {
  const { status } = req.body;

  const { error } = await supabase
    .from('colaboradores')
    .update({
      status,
      data_desativacao: status === 'Inativo' ? new Date() : null
    })
    .eq('id', req.params.id);

  if (error) return res.status(500).json(error);
  res.json({ message: 'Status atualizado' });
});

app.post('/colaboradores/:id/reajuste', async (req, res) => {
  try {
    const { percentual, bonus } = req.body;

    if (!percentual || percentual <= 0) {
      return res.status(400).json({ message: 'Percentual inválido' });
    }

    const { data: colaborador, error } = await supabase
      .from('colaboradores')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !colaborador) {
      return res.status(404).json({ message: 'Colaborador não encontrado' });
    }

    const salarioAnterior = colaborador.salario_atual;
    let salarioNovo = salarioAnterior + (salarioAnterior * percentual / 100);

    if (salarioAnterior < 1500 && bonus) {
      salarioNovo += Number(bonus);
    }

    salarioNovo = Number(salarioNovo.toFixed(2));

    const { error: updateError } = await supabase
      .from('colaboradores')
      .update({
        salario_anterior: salarioAnterior,
        salario_atual: salarioNovo,
        updated_at: new Date()
      })
      .eq('id', colaborador.id);

    if (updateError) {
      return res.status(500).json(updateError);
    }

    const { error: historicoError } = await supabase
      .from('historico_reajustes')
      .insert([{
        colaborador_id: colaborador.id,
        percentual_aumento: percentual,
        bonus_adicional: bonus || 0,
        salario_anterior: salarioAnterior,
        salario_novo: salarioNovo
      }]);

    if (historicoError) {
      return res.status(500).json(historicoError);
    }

    res.json({
      message: 'Reajuste aplicado e registrado com sucesso'
    });

  } catch {
    res.status(500).json({ message: 'Erro no reajuste' });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Servidor rodando em http://localhost:${process.env.PORT}`);
});
