import { montarMenu } from './menu';
describe('Menu de primeiros passos',()=>{
 it('oferece o checklist a quem tem ONBOARDING',()=>expect(montarMenu(['ONBOARDING']).barra.some(i=>i.url==='/primeiros-passos')).toBeTrue());
 it('não oferece o checklist sem permissão',()=>expect(montarMenu([]).barra.some(i=>i.url==='/primeiros-passos')).toBeFalse());
});
