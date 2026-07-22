import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Star } from 'lucide-react';
import { useState } from 'react';

const formSchema = z.object({
  authorName: z.string().trim().min(2, 'Enter your name').max(80),
  email: z.string().trim().email('Enter a valid email address'),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(3, 'Enter a short title').max(120),
  body: z.string().trim().min(10, 'Tell us a bit more').max(3000),
});

type FormValues = z.infer<typeof formSchema>;

type ReviewFormProps = {
  onSubmit: (values: FormValues) => void;
  isSubmitting: boolean;
  isSuccess: boolean;
};

export function ReviewForm({ onSubmit, isSubmitting, isSuccess }: ReviewFormProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { rating: 5 },
  });

  const rating = watch('rating');

  function handleFormSubmit(values: FormValues) {
    onSubmit(values);
    reset({ rating: 5, authorName: '', email: '', title: '', body: '' });
  }

  if (isSuccess) {
    return (
      <div className="card-surface p-6 text-center">
        <p className="font-semibold text-ink">Thanks for your review!</p>
        <p className="mt-1 text-sm text-ink-soft">It'll appear here once approved.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="card-surface space-y-5 p-6">
      <h3 className="font-semibold text-ink">Write a review</h3>

      <div>
        <p className="mb-2 text-sm font-medium text-ink">Your rating</p>
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setValue('rating', star, { shouldValidate: true })}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              aria-label={`${star} star${star > 1 ? 's' : ''}`}
              aria-checked={rating === star}
              role="radio"
            >
              <Star className={`h-7 w-7 ${star <= (hoverRating || rating) ? 'fill-warm-400 text-warm-400' : 'text-slate-200'}`} />
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="review-name" className="mb-1.5 block text-sm font-medium text-ink">Name</label>
          <input id="review-name" {...register('authorName')} className={`input-field ${errors.authorName ? 'input-error' : ''}`} />
          {errors.authorName && <p className="field-error-text">{errors.authorName.message}</p>}
        </div>
        <div>
          <label htmlFor="review-email" className="mb-1.5 block text-sm font-medium text-ink">Email</label>
          <input id="review-email" type="email" {...register('email')} className={`input-field ${errors.email ? 'input-error' : ''}`} />
          {errors.email && <p className="field-error-text">{errors.email.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="review-title" className="mb-1.5 block text-sm font-medium text-ink">Review title</label>
        <input id="review-title" {...register('title')} className={`input-field ${errors.title ? 'input-error' : ''}`} />
        {errors.title && <p className="field-error-text">{errors.title.message}</p>}
      </div>

      <div>
        <label htmlFor="review-body" className="mb-1.5 block text-sm font-medium text-ink">Your review</label>
        <textarea id="review-body" rows={4} {...register('body')} className={`input-field resize-none ${errors.body ? 'input-error' : ''}`} />
        {errors.body && <p className="field-error-text">{errors.body.message}</p>}
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full sm:w-auto">
        {isSubmitting ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  );
}
