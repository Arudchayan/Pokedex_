import React from 'react';
import { PokemonForm } from '../../types';

interface FormSelectorProps {
  forms: PokemonForm[];
  selectedForm: PokemonForm;
  onSelectForm: (form: PokemonForm) => void;
  isShiny: boolean;
}

const FormSelector: React.FC<FormSelectorProps> = ({
  forms,
  selectedForm,
  onSelectForm,
  isShiny
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 bg-black/10 p-2 rounded-lg">
      {forms.map(form => (
        <button
          key={form.id}
          onClick={() => onSelectForm(form)}
          className={`p-2 rounded-md transition-all duration-200 text-center
            ${selectedForm.id === form.id 
              ? 'bg-primary-500/20 ring-2 ring-primary-400'
              : 'bg-white/5 hover:bg-white/10'
            }`
          }
        >
          <img
            src={isShiny ? form.shinyImageUrl : form.imageUrl}
            alt={form.formName}
            className="h-16 w-16 mx-auto object-contain"
          />
          <p className="text-xs font-semibold capitalize mt-1 truncate">{form.formName}</p>
        </button>
      ))}
    </div>
  );
};

export default FormSelector;
