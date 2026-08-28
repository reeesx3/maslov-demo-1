const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-button');
const navLinks = document.querySelectorAll('.site-nav a');
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

const motionTargets = [
  ...document.querySelectorAll('.principle-card, .service-card, .project-card, .timeline li, .document-card')
];

let revealObserver;

const revealAllMotionTargets = () => {
  motionTargets.forEach((target) => target.classList.add('is-revealed'));
};

const initialiseMotion = () => {
  if (reducedMotionQuery.matches) {
    revealAllMotionTargets();
    return;
  }

  document.documentElement.classList.add('has-motion');
  motionTargets.forEach((target, index) => {
    target.classList.add('motion-reveal');
    target.style.setProperty('--motion-delay', `${(index % 4) * 45}ms`);
  });

  if (!('IntersectionObserver' in window)) {
    revealAllMotionTargets();
    return;
  }

  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-revealed');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.14 });

  motionTargets.forEach((target) => revealObserver.observe(target));
};

initialiseMotion();

reducedMotionQuery.addEventListener('change', (event) => {
  document.documentElement.classList.toggle('has-motion', !event.matches);
  if (!event.matches) return;

  revealObserver?.disconnect();
  revealAllMotionTargets();
});

document.querySelectorAll('.faq details').forEach((details) => {
  const summary = details.querySelector('summary');

  summary.addEventListener('click', (event) => {
    if (reducedMotionQuery.matches) return;
    if (details.dataset.animating === 'true') {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    const startHeight = `${details.offsetHeight}px`;
    const isOpen = details.open;

    if (!isOpen) details.open = true;

    const endHeight = isOpen ? `${summary.offsetHeight}px` : `${details.offsetHeight}px`;
    details.dataset.animating = 'true';
    details.style.overflow = 'hidden';

    const animation = details.animate(
      { height: [startHeight, endHeight] },
      { duration: 280, easing: 'cubic-bezier(.2, .7, .2, 1)', fill: 'both' }
    );

    animation.onfinish = () => {
      if (isOpen) details.open = false;
      details.style.height = '';
      details.style.overflow = '';
      delete details.dataset.animating;
    };
  });
});

const setHeaderState = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
setHeaderState();
window.addEventListener('scroll', setHeaderState, { passive: true });

menuButton.addEventListener('click', () => {
  const isOpen = header.classList.toggle('is-open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
});

navLinks.forEach((link) => link.addEventListener('click', () => {
  header.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Открыть меню');
}));

const formMessages = {
  missingName: 'Укажите имя, чтобы мы знали, как к вам обращаться.',
  invalidPhone: 'Введите номер в формате +7 (999) 123-45-67.',
  missingConsent: 'Подтвердите согласие на обработку персональных данных.',
  unavailable: 'Форма пока не подключена к сервису: заявка не отправлена.',
  failed: 'Не удалось отправить заявку. Проверьте соединение и попробуйте ещё раз.'
};

const formatPhone = (value) => {
  const raw = value.replace(/\D/g, '');
  if (!raw) return '';

  const digits = (raw.startsWith('7') || raw.startsWith('8') ? `7${raw.slice(1)}` : `7${raw}`).slice(0, 11);
  const code = digits.slice(1, 4);
  const first = digits.slice(4, 7);
  const second = digits.slice(7, 9);
  const third = digits.slice(9, 11);
  let result = '+7';

  if (code) result += ` (${code}`;
  if (code.length === 3) result += ')';
  if (first) result += ` ${first}`;
  if (second) result += `-${second}`;
  if (third) result += `-${third}`;
  return result;
};

const setFormStatus = (form, state = '', message = '') => {
  const status = form.querySelector('[data-form-status]');
  if (!status) return;

  status.dataset.state = state;
  status.textContent = message;
};

const clearFieldErrors = (form) => {
  form.querySelectorAll('[aria-invalid="true"]').forEach((field) => field.removeAttribute('aria-invalid'));
  form.querySelectorAll('[data-field-error]').forEach((error) => { error.textContent = ''; });
  form.querySelectorAll('.has-error').forEach((field) => field.classList.remove('has-error'));
};

const setFieldError = (form, fieldName, message) => {
  const field = form.elements[fieldName];
  const error = form.querySelector(`[data-field-error="${fieldName}"]`);
  const wrapper = field?.closest('.form-field, .consent-check');

  field?.setAttribute('aria-invalid', 'true');
  wrapper?.classList.add('has-error');
  if (error) error.textContent = message;
};

const validateContactForm = (form) => {
  clearFieldErrors(form);
  setFormStatus(form);

  if (form.elements.website?.value.trim()) {
    setFormStatus(form, 'error', 'Не удалось отправить форму. Попробуйте ещё раз.');
    return false;
  }

  if (!form.elements.name.value.trim()) {
    setFieldError(form, 'name', formMessages.missingName);
    setFormStatus(form, 'error', formMessages.missingName);
    form.elements.name.focus();
    return false;
  }

  const digits = form.elements.phone.value.replace(/\D/g, '');
  if (digits.length !== 11 || !digits.startsWith('7')) {
    setFieldError(form, 'phone', formMessages.invalidPhone);
    setFormStatus(form, 'error', formMessages.invalidPhone);
    form.elements.phone.focus();
    return false;
  }

  if (!form.elements.consent.checked) {
    setFieldError(form, 'consent', formMessages.missingConsent);
    setFormStatus(form, 'error', formMessages.missingConsent);
    form.elements.consent.focus();
    return false;
  }

  return true;
};

const setSubmitLoading = (button, isLoading) => {
  if (!button) return;

  if (isLoading) {
    button.dataset.label = button.innerHTML;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.innerHTML = 'Отправляем…';
  } else {
    button.disabled = false;
    button.removeAttribute('aria-busy');
    if (button.dataset.label) button.innerHTML = button.dataset.label;
  }
};

const sendForm = async (form, successMessage) => {
  if (form.dataset.submitting === 'true' || form.dataset.sent === 'true') return false;

  const endpoint = form.dataset.endpoint?.trim();
  if (!endpoint) {
    setFormStatus(form, 'error', formMessages.unavailable);
    return false;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  const payload = Object.fromEntries(new FormData(form).entries());
  delete payload.website;
  payload.formType = form.dataset.formType || 'Форма с сайта';
  form.dataset.submitting = 'true';
  setSubmitLoading(submitButton, true);
  setFormStatus(form, 'loading', 'Отправляем заявку…');

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(endpoint, {
      method: form.dataset.method || 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!response.ok) throw new Error(`Request failed with ${response.status}`);

    form.dataset.sent = 'true';
    submitButton.disabled = true;
    submitButton.removeAttribute('aria-busy');
    submitButton.innerHTML = 'Заявка отправлена';
    setFormStatus(form, 'success', successMessage);
    return true;
  } catch (error) {
    setFormStatus(form, 'error', formMessages.failed);
    setSubmitLoading(submitButton, false);
    return false;
  } finally {
    window.clearTimeout(timeout);
    delete form.dataset.submitting;
  }
};

document.querySelectorAll('[data-phone-input]').forEach((input) => {
  input.addEventListener('input', () => {
    input.value = formatPhone(input.value);
    input.removeAttribute('aria-invalid');
    input.closest('.form-field')?.classList.remove('has-error');
    input.closest('form')?.querySelector('[data-field-error="phone"]')?.replaceChildren();
  });
});

const quizForm = document.querySelector('#quiz-form');
const quizSteps = [...document.querySelectorAll('.quiz__step')];
const quizStepLabel = document.querySelector('#quiz-step');
const quizProgress = document.querySelector('#quiz-progress');
const quizNext = document.querySelector('#quiz-next');
const quizBack = document.querySelector('#quiz-back');
const quizSubmit = document.querySelector('#quiz-submit');
const quizContact = document.querySelector('.quiz__contact');
const quizConsent = document.querySelector('.quiz__consent');
const quizResult = document.querySelector('#quiz-result');
let currentQuizStep = 1;
let contactStep = false;

const renderQuiz = () => {
  quizSteps.forEach((step) => step.classList.toggle('is-active', !contactStep && Number(step.dataset.step) === currentQuizStep));
  quizContact.hidden = !contactStep;
  quizConsent.hidden = !contactStep;
  quizNext.hidden = contactStep;
  quizSubmit.hidden = !contactStep;
  quizBack.hidden = currentQuizStep === 1 && !contactStep;
  quizStepLabel.textContent = contactStep ? 'Контакты' : `Шаг ${currentQuizStep} из 4`;
  quizProgress.style.width = `${contactStep ? 100 : currentQuizStep * 25}%`;
  setFormStatus(quizForm);
};

const isStepAnswered = (step) => Boolean(quizForm.querySelector(`.quiz__step[data-step="${step}"] input:checked`));

quizNext.addEventListener('click', () => {
  if (!isStepAnswered(currentQuizStep)) {
    setFormStatus(quizForm, 'error', 'Выберите один вариант, чтобы продолжить.');
    return;
  }

  if (currentQuizStep < 4) currentQuizStep += 1;
  else contactStep = true;
  renderQuiz();
});

quizBack.addEventListener('click', () => {
  if (contactStep) contactStep = false;
  else if (currentQuizStep > 1) currentQuizStep -= 1;
  renderQuiz();
});

quizForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!validateContactForm(quizForm)) return;

  const didSend = await sendForm(quizForm, 'Заявка отправлена. Мы получили данные для предварительного расчёта.');
  if (!didSend) return;

  quizForm.querySelector('.quiz__head').hidden = true;
  quizContact.hidden = true;
  quizConsent.hidden = true;
  quizForm.querySelector('.quiz__actions').hidden = true;
  quizForm.querySelector('.form-demo-note').hidden = true;
  quizResult.hidden = false;
});

renderQuiz();

const callbackModal = document.querySelector('#callback-modal');
const callbackForm = document.querySelector('#callback-form');
const callbackTriggers = document.querySelectorAll('[data-callback-open]');
const callbackClose = document.querySelector('[data-callback-close]');

const openCallbackModal = () => {
  header.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  callbackModal.showModal();
  window.setTimeout(() => callbackForm.elements.name.focus(), 0);
};

callbackTriggers.forEach((trigger) => trigger.addEventListener('click', openCallbackModal));
callbackClose.addEventListener('click', () => callbackModal.close());
callbackModal.addEventListener('click', (event) => {
  const bounds = callbackModal.getBoundingClientRect();
  const clickedOutside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  if (clickedOutside) callbackModal.close();
});

callbackModal.addEventListener('close', () => {
  if (callbackForm.dataset.sent === 'true') return;
  callbackForm.reset();
  clearFieldErrors(callbackForm);
  setFormStatus(callbackForm);
});

callbackForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!validateContactForm(callbackForm)) return;

  await sendForm(callbackForm, 'Заявка отправлена. Мы перезвоним вам в ближайшее время.');
});

const projects = [
  {
    title: 'Светлая квартира для пары',
    description: 'Светлая палитра, дерево и мягкий дневной свет — визуальная концепция для квартиры площадью 52 м².',
    images: [
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1500&q=85',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1500&q=85',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1500&q=85'
    ]
  },
  {
    title: 'Компактная студия для сдачи',
    description: 'Функциональная, спокойная и нейтральная среда: визуальный пример для площади 31 м².',
    images: [
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1500&q=85',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1500&q=85',
      'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1500&q=85'
    ]
  },
  {
    title: 'Семейная квартира с рабочей зоной',
    description: 'Жилое пространство с отдельной рабочей зоной — демонстрационный проект площадью 78 м².',
    images: [
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1500&q=85',
      'https://images.unsplash.com/photo-1615529328331-f8917597711f?auto=format&fit=crop&w=1500&q=85',
      'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1500&q=85'
    ]
  }
];

const galleryModal = document.querySelector('#gallery-modal');
const galleryImage = document.querySelector('#gallery-image');
const galleryTitle = document.querySelector('#gallery-title');
const galleryDescription = document.querySelector('#gallery-description');
const galleryThumbs = document.querySelector('#gallery-thumbs');
const galleryClose = document.querySelector('.gallery-modal__close');

const setGalleryImage = (project, imageIndex) => {
  galleryImage.src = project.images[imageIndex];
  galleryImage.alt = `${project.title}: изображение ${imageIndex + 1}`;
  [...galleryThumbs.children].forEach((thumb, index) => thumb.classList.toggle('is-active', index === imageIndex));
};

const openGallery = (projectIndex) => {
  const project = projects[projectIndex];
  galleryTitle.textContent = project.title;
  galleryDescription.textContent = project.description;
  galleryThumbs.innerHTML = '';
  project.images.forEach((src, imageIndex) => {
    const thumbnail = document.createElement('button');
    thumbnail.type = 'button';
    thumbnail.setAttribute('aria-label', `Открыть изображение ${imageIndex + 1}`);
    const image = document.createElement('img');
    image.src = src;
    image.alt = '';
    thumbnail.append(image);
    thumbnail.addEventListener('click', () => setGalleryImage(project, imageIndex));
    galleryThumbs.append(thumbnail);
  });
  setGalleryImage(project, 0);
  galleryModal.showModal();
};

document.querySelectorAll('[data-project]').forEach((button) => button.addEventListener('click', () => openGallery(Number(button.dataset.project))));
galleryClose.addEventListener('click', () => galleryModal.close());
galleryModal.addEventListener('click', (event) => {
  const bounds = galleryModal.getBoundingClientRect();
  const clickedOutside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  if (clickedOutside) galleryModal.close();
});

const documentExamples = {
  estimate: {
    title: 'Пример сметы на ремонт',
    description: 'Демонстрационный расчёт с разбивкой работ и материалов. Все данные в примере нейтральны и не относятся к реальному объекту.',
    src: 'assets/documents/repair-estimate-demo.png',
    alt: 'Пример сметы на ремонт: таблицы работ, материалов и итоговой стоимости'
  },
  schedule: {
    title: 'Пример графика выполнения работ',
    description: 'Демонстрационный график показывает последовательность этапов ремонта и ориентировочные сроки выполнения работ.',
    src: 'assets/documents/work-schedule-demo.png',
    alt: 'Пример графика выполнения работ: этапы ремонта и сроки по неделям'
  },
  checklist: {
    title: 'Пример чек-листа приёмки',
    description: 'Демонстрационный список проверок для отделки, электрики, сантехники, пола и фурнитуры перед сдачей этапа.',
    src: 'assets/documents/acceptance-checklist-demo.png',
    alt: 'Пример чек-листа приёмки: проверки отделки, электрики, сантехники и фурнитуры'
  }
};

const documentModal = document.querySelector('#document-modal');
const documentModalImage = document.querySelector('#document-modal-image');
const documentModalTitle = document.querySelector('#document-modal-title');
const documentModalDescription = document.querySelector('#document-modal-description');
const documentModalClose = document.querySelector('[data-document-close]');

const openDocumentModal = (documentKey) => {
  const documentExample = documentExamples[documentKey];
  if (!documentExample) return;

  documentModalTitle.textContent = documentExample.title;
  documentModalDescription.textContent = documentExample.description;
  documentModalImage.src = documentExample.src;
  documentModalImage.alt = documentExample.alt;
  documentModal.showModal();
  window.setTimeout(() => documentModalClose.focus(), 0);
};

document.querySelectorAll('[data-document]').forEach((button) => button.addEventListener('click', () => openDocumentModal(button.dataset.document)));
documentModalClose.addEventListener('click', () => documentModal.close());
documentModal.addEventListener('click', (event) => {
  const bounds = documentModal.getBoundingClientRect();
  const clickedOutside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  if (clickedOutside) documentModal.close();
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  header.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Открыть меню');
});
