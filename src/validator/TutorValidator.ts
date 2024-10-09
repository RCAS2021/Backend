import { body } from 'express-validator';
import { cpf } from 'cpf-cnpj-validator';
import { Tutor } from '../entity/Tutor';
import { Subject } from '../entity/Subject';
import { EducationLevel } from '../entity/EducationLevel';
import { BaseValidator } from './BaseValidator'
import { RequestHandler } from 'express';
import { MysqlDataSource } from '../config/database';

const birthDateRegex = /^(0[1-9]|1[0-9]|2[0-9]|3[0-1])\/(0[1-9]|1[0-2]|[0-9])\/\d{4}$/;
const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%¨&*])[A-Za-z\d!@#$%¨&*]{6,}$/;
const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;

export class TutorValidator extends BaseValidator{
    public static create(): Array<RequestHandler> {
        return [
            body('fullName')
                .trim()
                .isString().withMessage('Nome completo deve ser uma string.')
                .notEmpty().withMessage('Nome completo é obrigatório.'),
            
            body('username')
                .trim()
                .isString().withMessage('Nome de usuário deve ser uma string.')
                .notEmpty().withMessage('Nome de usuário é obrigatório.'),
            
            body('birthDate')
                .trim()
                .isString().withMessage('Data de nascimento deve ser uma string.')
                .notEmpty().withMessage('Data de nascimento é obrigatória.')
                .custom((value) => {
                    if (!birthDateRegex.test(value)) {
                        throw new Error('Data de nascimento deve estar no formato DD/MM/YYYY.');
                    }
                    return true;
                }),
            
            body('password')
                .trim()
                .isString().withMessage('Senha deve ser uma string.')
                .notEmpty().withMessage('Senha é obrigatória.')
                .isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres.')
                .custom((value) => {
                    if (!passwordRegex.test(value)) {
                        throw new Error('A senha deve ter ao menos 1 letra maiúscula, 1 número e 1 caractere especial.');
                    }
                    return true;
                }),
            
            body('cpf')
                .trim()
                .isString().withMessage('CPF deve ser uma string.')
                .notEmpty().withMessage('CPF é obrigatório.')
                .custom((value) => {
                    if (!cpfRegex.test(value)) {
                        throw new Error('Formato do CPF inválido.');
                    }

                    const cleanCpf = value.replace(/\D/g, "");
                    if (!cpf.isValid(cleanCpf)) {
                        throw new Error('CPF inválido.')
                    }

                    return true;
                }),
            
            body('email')
                .trim()
                .isString().withMessage('Email deve ser uma string.')
                .notEmpty().withMessage('Email é obrigatório.')
                .isEmail().withMessage('Email deve ser válido.')
                .custom(async (value) => {
                    const tutorRepository = MysqlDataSource.getRepository(Tutor);
                    const existingTutor = await tutorRepository.findOne({ where: { email: value } });
                    
                    if (existingTutor) {
                        return Promise.reject('Email já cadastrado');
                    }

                    return true;
                }),

            body('subjects')
                .trim()
                .isArray().withMessage('Matérias devem ser uma lista de IDs.')
                .notEmpty().withMessage('Matérias são obrigatórias.')
                .custom(async (value) => {
                    const subjectRepository = MysqlDataSource.getRepository(Subject);
                    const subjects = await subjectRepository.findByIds(value);

                    if (subjects.length !== value.length) {
                        return Promise.reject('Uma ou mais matérias não existem.');
                    }

                    return true;
                }),
            
            body('educationLevel')
                .trim()
                .isArray().withMessage('Faixa de ensino devem ser uma lista de IDs.')
                .notEmpty().withMessage('Faixa de ensino é obrigatória.')
                .custom(async (value) => {
                    const educationLevelRepository = MysqlDataSource.getRepository(EducationLevel);

                    const parsedValues = value.map((id: string) => Number(id));
                    const educationLevels = await educationLevelRepository.findByIds(parsedValues);
                    if (educationLevels.length !== value.length) {
                        return Promise.reject('Uma ou mais faixas de ensino não existem.');
                    }

                    return true;
                }),
        ];
    }
}