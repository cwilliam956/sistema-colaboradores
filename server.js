import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';

dotenv.config();

console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_KEY EXISTE?', !!process.env.SUPABASE_KEY);

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
  console.log('REQ BODY:', req.body);

  const { nome_completo, re, cargo, salario_atual } = req.body;

  const { data: empresa, error: empresaError } = await supabase
    .from('empresas')
    .select('id')
    .limit(1)
    .single();

  console.log('EMPRESA:', empresa);
  console.log('EMPRESA ERROR:', empresaError);

  const { data, error } = await supabase
    .from('colaboradores')
    .insert([{
      nome_completo,
      re,
      cargo,
      salario_atual,
      salario_anterior: salario_atual,
      empresa_id: empresa.id
    }])
    .select();

  console.log('INSERT DATA:', data);
  console.log('INSERT ERROR:', error);

  if (error) {
    return res.status(500).json(error);
  }

  res.json({ message: 'INSERIU', data });
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

app.listen(process.env.PORT, () => {
  console.log(`Servidor rodando em http://localhost:${process.env.PORT}`);
});

const testeSupabase = async () => {
  const { data, error } = await supabase
    .from('empresas')
    .select('*');

  console.log('TESTE SUPABASE DATA:', data);
  console.log('TESTE SUPABASE ERROR:', error);
};

testeSupabase();
