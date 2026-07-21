// Seleciona o formulário
const form = document.querySelector('form');

// Funções de máscara
function maskCPF(cpf) {
    return cpf
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(\-\d{2})\d+?$/, '$1');
}

function maskPhone(phone) {
    return phone
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4,5})(\d{4})(\d{0,1})/, '$1-$2$3')
        .replace(/(-\d{4})\d+?$/, '$1');
}

function maskCEP(cep) {
    return cep
        .replace(/\D/g, '')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{3})\d+?$/, '$1');
}


// Função para buscar dados do CPF
async function buscarDadosCPF(cpf) {
    console.log('Iniciando busca por CPF:', cpf);
    try {
        const response = await fetch(`buscarCpf.php?cpf=${cpf}`);
        const data = await response.json();
        
        if (data.erro) {
            console.error('Erro na API:', data.erro);
            return;
        }
        
        // Preenche os campos com os dados retornados
        const nomeInput = document.querySelector('input[name="nomeCompleto"]');
        const dataInput = document.querySelector('input[name="dataAniversario"]');
        const generoSelect = document.querySelector('select[name="genero"]');
        
        if (data.nome && nomeInput) {
            nomeInput.value = data.nome;
            validateField(nomeInput);
        }
        
        // Preenche o gênero se disponível
        if (data.sexo && generoSelect) {
            const genero = data.sexo.toLowerCase(); // Converte para minúsculas
            const option = generoSelect.querySelector(`option[value="${genero}"]`);
            if (option) {
                generoSelect.value = genero;
                // Dispara o evento de mudança para mostrar/ocultar a mensagem especial
                const event = new Event('change');
                generoSelect.dispatchEvent(event);
            }
        }
        
        if (data.data_nascimento && dataInput) {
            // Converte a data de dd/mm/yyyy para yyyy-mm-dd
            const [day, month, year] = data.data_nascimento.split('/');
            const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            dataInput.value = formattedDate;
            validateField(dataInput);
            
            // Dispara o evento de mudança para atualizar a mensagem de idade válida
            const event = new Event('change');
            dataInput.dispatchEvent(event);
            
            // Também podemos calcular a idade diretamente
            const hoje = new Date();
            const nascimento = new Date(formattedDate);
            let idade = hoje.getFullYear() - nascimento.getFullYear();
            const mesAtual = hoje.getMonth();
            const mesNascimento = nascimento.getMonth();
            
            if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
                idade--;
            }
            
            const idadeTexto = document.getElementById('idade-texto');
            const idadeValidaMessage = document.getElementById('idade-valida-message');
            
            if (idadeTexto && idadeValidaMessage) {
                idadeTexto.textContent = idade;
                idadeValidaMessage.classList.remove('hidden');
            }
        }
    } catch (error) {
        console.error('Erro ao buscar CPF:', error);
    }
}

// Função para buscar dados do CEP
async function buscarDadosCEP(cep) {
    const cepCheckIcon = document.getElementById('cep-check-icon');
    
    try {
        // Esconde o ícone de check antes de fazer a requisição
        if (cepCheckIcon) {
            cepCheckIcon.classList.add('hidden');
        }
        
        const response = await fetch(`buscarCep.php?cep=${cep}`);
        const data = await response.json();
        
        if (!data.sucesso) {
            console.error('Erro ao buscar CEP:', data.mensagem);
            return false;
        }
        
        // Preenche os campos do formulário
        const { logradouro, bairro, cidade, uf } = data.dados;
        
        // Função auxiliar para preencher campos
        const preencherCampo = (nome, valor) => {
            const campo = document.querySelector(`[name="${nome}"]`);
            if (campo && valor) {
                campo.value = valor;
                validateField(campo);
            }
        };
        
        // Preenche os campos
        preencherCampo('logradouro', logradouro);
        preencherCampo('bairro', bairro);
        preencherCampo('cidade', cidade);
        preencherCampo('uf', uf);
        
        // Mostra o ícone de check após preencher os campos
        if (cepCheckIcon) {
            cepCheckIcon.classList.remove('hidden');
        }
        
        return true;
        
    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        if (cepCheckIcon) {
            cepCheckIcon.classList.add('hidden');
        }
        return false;
    }
}


// Aplica máscaras e validações aos campos
document.addEventListener('input', function(e) {
    const target = e.target;
    const value = target.value;
    const name = target.name;
    
    

    if (name === 'cpf') {
        const cpfFormatado = maskCPF(value);
        target.value = cpfFormatado;
        
        // Verifica se o CPF está completo (14 caracteres com máscara)
        const cpfNumeros = value.replace(/\D/g, '');
        if (cpfNumeros.length === 11) {
            buscarDadosCPF(cpfNumeros);
        }
    } else if (name === 'telefone') {
        target.value = maskPhone(value);
    } else if (name === 'cep') {
        target.value = maskCEP(value);
        const cepCheckIcon = document.getElementById('cep-check-icon');
        
        // Esconde o ícone se o CEP for alterado
        if (cepCheckIcon) {
            cepCheckIcon.classList.add('hidden');
        }
        
        // Verifica se o CEP está completo (8 dígitos)
        const cepNumeros = value.replace(/\D/g, '');
        if (cepNumeros.length === 8) {
            buscarDadosCEP(cepNumeros);
        } else if (cepCheckIcon) {
            // Garante que o ícone está escondido se o CEP for inválido
            cepCheckIcon.classList.add('hidden');
        }
    } 
});

// Função para atualizar o estado visual dos campos
function updateFieldVisualState(field, isValid) {
    const messageId = field.getAttribute('aria-describedby')?.split(' ')?.[1];
    if (!messageId) return;

    const errorMessage = document.getElementById(messageId);
    if (!errorMessage) return;

    // Encontra o label associado ao campo
    const fieldId = field.id;
    const label = document.querySelector(`label[for="${fieldId}"]`);
    
    if (isValid) {
        field.setAttribute('aria-invalid', 'false');
        errorMessage.style.display = 'none';
        if (label) {
            label.classList.remove('text-destructive');
        }
    } else {
        field.setAttribute('aria-invalid', 'true');
        errorMessage.style.display = 'block';
        if (label) {
            label.classList.add('text-destructive');
        }
    }
}

// Função para validar campo individual
function validateField(field) {
    const messageId = field.getAttribute('aria-describedby')?.split(' ')?.[1];
    if (!messageId) return true;

    const errorMessage = document.getElementById(messageId);
    if (!errorMessage) return true;

    const value = field.value.trim();
    let isValid = true;
    let customMessage = '';

    // Validações específicas por tipo de campo
    if (field.name === 'cpf') {
        const cpf = value.replace(/\D/g, '');
        isValid = cpf.length === 11;
        customMessage = 'CPF deve ter 11 dígitos';
    }
    else if (field.name === 'cep') {
        const cep = value.replace(/\D/g, '');
        isValid = cep.length === 8;
        customMessage = 'CEP deve ter 8 dígitos';
    } 
    else if (field.name === 'telefone') {
        const phone = value.replace(/\D/g, '');
        isValid = phone.length >= 10 && phone.length <= 11;
        customMessage = 'Telefone deve ter 10 ou 11 dígitos';
    }
    
    // Se for um campo obrigatório vazio
    if (!value && field.getAttribute('aria-required') === 'true') {
        updateFieldVisualState(field, false);
        return false;
    }
    // Se tiver valor mas não passar na validação específica
    else if (value && !isValid) {
        if (customMessage && errorMessage) {
            errorMessage.textContent = customMessage;
        }
        updateFieldVisualState(field, false);
        return false;
    }
    // Se estiver tudo ok
    else {
        updateFieldVisualState(field, true);
        return true;
    }
}

// Função para inicializar a validação
function initFormValidation() {
    // Remove a classe text-destructive de todas as labels primeiro
    document.querySelectorAll('label').forEach(label => {
        label.classList.remove('text-destructive');
    });

    // Esconde todas as mensagens de erro iniciais
    document.querySelectorAll('[id$="-form-item-message"]').forEach(message => {
        message.style.display = 'none';
    });

    // Inicializa o estado dos campos
    document.querySelectorAll('[aria-describedby*="-form-item-message"]').forEach(field => {
        field.setAttribute('aria-required', 'true');
        field.setAttribute('aria-invalid', 'false');
        
        // Se o campo já tiver valor, valida ele
        if (field.value.trim()) {
            validateField(field);
        }
    });
}

// Inicializa a validação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    initFormValidation();
    
    
    

    // Validação ao sair do campo
    form.addEventListener('focusout', (e) => {
        if (e.target.matches('input, select, textarea')) {
            validateField(e.target);
        }
    });

    // Validação ao enviar o formulário
    form.addEventListener('submit', (e) => {
        let isValid = true;
        const fields = form.querySelectorAll('[aria-required="true"]');
        
        // Valida todos os campos obrigatórios
        fields.forEach(field => {
            if (!validateField(field)) {
                isValid = false;
            }
        });

        if (isValid) {
            e.preventDefault();
            
            // Coleta os dados do formulário
            const formData = new FormData(form);
            const params = new URLSearchParams();
            
             // Converte os dados do formulário para parâmetros de URL
            for (const [key, value] of formData.entries()) {
                    if (key === 'cpf') {
                        // Remove todos os caracteres não numéricos do CPF
                        const cpfValue = value.toString().replace(/[^0-9]/g, '');
                        params.append(key, cpfValue);
                    } else {
                        params.append(key, value);
                    }
                }
            
            // Define o redirecionamento após 5 segundos
            setTimeout(() => {
                window.location.href = 'termos.php?' + params.toString();
            }, 15000);
        } else {
            e.preventDefault();
        }
    });
});


function toggleOptions() {
    document.getElementById('options').style.display =
        document.getElementById('options').style.display === 'block' ? 'none' : 'block';
}


document.querySelectorAll('.turno-opcao').forEach(opcao => {
  opcao.addEventListener('click', () => {
    document.querySelectorAll('.turno-opcao').forEach(o => o.classList.remove('selecionado'));
    opcao.classList.add('selecionado');
    opcao.querySelector('input').checked = true;
  });
});