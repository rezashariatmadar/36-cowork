import { useForm, Controller } from "react-hook-form";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { useState, useEffect, useMemo, useCallback, memo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

// ============================================================================ 
// SECTION 1: CONSTANTS & STYLES
// ============================================================================ 

const VAZIRMATN_FONT_URL = 'https://cdn.jsdelivr.net/npm/vazirmatn@33.003/Vazirmatn-font-face.css';

// تنظیم احراز هویت زیبال: 0 = غیرفعال، 1 = فعال
const ENABLE_ZIBAL_VERIFICATION = 0; // Set to 0 by default for testing

const FORM_STYLES = {
  fontFamily: 'Vazirmatn, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
};

const INPUT_STYLES = {
  background: 'linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%)',
  color: '#0a0a0a',
  border: '2px solid #e2e8f0',
  fontWeight: 600,
  transition: 'all 0.2s ease',
  fontFamily: 'Vazirmatn, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
};

const ERROR_STYLES = {
  color: '#e53e3e',
  fontWeight: 600,
  fontSize: '0.75rem',
  marginTop: '0.25rem',
  position: 'absolute',
  left: '0',
  bottom: '-1.4rem'
};

const INPUT_CONTAINER_STYLE = {
  position: 'relative',
  marginBottom: '1.2rem'
};

const PERSIAN_MONTHS = [
  { value: '01', label: 'فروردین' },
  { value: '02', label: 'اردیبهشت' },
  { value: '03', label: 'خرداد' },
  { value: '04', label: 'تیر' },
  { value: '05', label: 'مرداد' },
  { value: '06', label: 'شهریور' },
  { value: '07', label: 'مهر' },
  { value: '08', label: 'آبان' },
  { value: '09', label: 'آذر' },
  { value: '10', label: 'دی' },
  { value: '11', label: 'بهمن' },
  { value: '12', label: 'اسفند' }
];

const CONSTELLATIONS = [
  {
    name: 'bigDipper',
    stars: [{ x: 0, y: 0 }, { x: 3, y: -1 }, { x: 6, y: -1 }, { x: 9, y: 0 }, { x: 10, y: 3 }, { x: 8, y: 6 }, { x: 5, y: 7 }]
  },
  {
    name: 'orionBelt',
    stars: [{ x: 0, y: 0 }, { x: 3, y: -0.5 }, { x: 6, y: 0 }, { x: 2, y: -4 }, { x: 4, y: -4.5 }, { x: 1, y: 4 }, { x: 5, y: 4 }]
  },
  {
    name: 'cassiopeia',
    stars: [{ x: 0, y: 0 }, { x: 2, y: 2 }, { x: 4, y: 0 }, { x: 6, y: 2 }, { x: 8, y: 0 }]
  },
  {
    name: 'leo',
    stars: [{ x: 0, y: 0 }, { x: 3, y: 1 }, { x: 5, y: 3 }, { x: 4, y: 5 }, { x: 2, y: 6 }, { x: 1, y: 4 }]
  }
];

// ============================================================================ 
// SECTION 2: VALIDATION REGEX & MAPS
// ============================================================================ 

const NATIONAL_CODE_REGEX = /^\d{10}$/;
const NATIONAL_CODE_REPEAT_REGEX = /^(\d)\1{9}$/;
const PHONE_REGEX_1 = /^09\d{9}$/;
const PHONE_REGEX_2 = /^\+989\d{9}$/;
const PHONE_REGEX_3 = /^00989\d{9}$/;
const TEXT_ONLY_REGEX = /^[a-zA-Zآ-ی]$/;
const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const persianToEnglishMap = {
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
};

// ============================================================================ 
// SECTION 3: HELPER FUNCTIONS
// ============================================================================ 

const convertPersianToEnglish = (str) => {
  if (!str) return str;
  return str.toString().replace(/[۰-۹]/g, (w) => persianToEnglishMap[w]);
};

const validateNationalCode = (code) => {
  code = convertPersianToEnglish(code.toString().trim());
  if (!NATIONAL_CODE_REGEX.test(code)) return false;
  if (NATIONAL_CODE_REPEAT_REGEX.test(code)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(code.charAt(i)) * (10 - i);
  }

  const remainder = sum % 11;
  const checkDigit = parseInt(code.charAt(9));

  return remainder < 2 ? checkDigit === remainder : checkDigit === (11 - remainder);
};

const validatePhoneNumber = (phone) => {
  let cleanPhone = convertPersianToEnglish(phone.toString().trim().replace(/\s+/g, ''));
  return PHONE_REGEX_1.test(cleanPhone) || PHONE_REGEX_2.test(cleanPhone) || PHONE_REGEX_3.test(cleanPhone);
};

const isLeapYearPersian = (year) => {
  const breaks = [1, 5, 9, 13, 17, 22, 26, 30];
  const cycle = 33;
  const yearInCycle = ((year - 1) % cycle) + 1;
  return breaks.includes(yearInCycle);
};

const validatePersianDate = (year, month, day) => {
  const y = parseInt(convertPersianToEnglish(year));
  const m = parseInt(convertPersianToEnglish(month));
  const d = parseInt(convertPersianToEnglish(day));

  if (isNaN(y) || isNaN(m) || isNaN(d)) return false;
  if (y < 1305 || y > 1404) return false;
  if (m < 1 || m > 12) return false;

  const maxDays = m <= 6 ? 31 : m <= 11 ? 30 : (isLeapYearPersian(y) ? 30 : 29);
  return d >= 1 && d <= maxDays;
};

const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];

const handleNumericInput = (e) => {
  if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) return;
  if (/[۰-۹0-9]/.test(e.key)) return;
  e.preventDefault();
};

const handlePhoneInput = (e) => {
  if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) return;
  if (/[۰-۹0-9]/.test(e.key)) return;
  if (e.key === ' ' || e.key === '+') return;
  e.preventDefault();
};

const handleTextOnlyInput = (e) => {
  if (allowedKeys.includes(e.key) || e.key === ' ') return;
  if (TEXT_ONLY_REGEX.test(e.key)) return;
  e.preventDefault();
};

// ============================================================================ 
// SECTION 5: UI COMPONENTS (ICONS & BACKGROUND)
// ============================================================================ 

const MaleIcon = memo(() => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="7" r="4" />
    <path d="M5 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" />
  </svg>
));

const FemaleIcon = memo(() => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12z" />
    <path d="M12 15v7" />
    <path d="M9 19h6" />
  </svg>
));

const Star = memo(({ dot, distance, hasMouseMoved, isTouchDevice }) => {
  const useMouseEffect = hasMouseMoved && !isTouchDevice;

  const { opacity, scale } = useMemo(() => {
    if (!useMouseEffect) return { opacity: undefined, scale: undefined };
    if (distance < 15) return { opacity: 0.95, scale: 2 };
    if (distance < 25) return { opacity: 0.7, scale: 1.3 };
    return { opacity: 0.5, scale: 1 };
  }, [useMouseEffect, distance]);

  const boxShadow = useMemo(() => {
    if (!useMouseEffect) return dot.isConstellation ? '0 0 6px rgba(255, 255, 255, 0.6)' : '0 0 4px rgba(255, 255, 255, 0.4)';
    if (distance < 15) return '0 0 12px rgba(255, 255, 255, 0.9)';
    if (distance < 25) return '0 0 6px rgba(255, 255, 255, 0.5)';
    return 'none';
  }, [useMouseEffect, distance, dot.isConstellation]);

  const starStyle = useMemo(() => ({
    width: `${dot.size}px`,
    height: `${dot.size}px`,
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    opacity,
    transform: useMouseEffect ? `scale(${scale})` : undefined,
    transition: useMouseEffect ? 'opacity 0.3s ease, transform 0.3s ease' : 'none',
    boxShadow,
    animation: (isTouchDevice || !hasMouseMoved) ? `twinkle-${dot.id} ${dot.twinkleDuration}s ease-in-out ${dot.twinkleDelay}s infinite` : 'none',
    position: 'relative'
  }), [dot, opacity, scale, boxShadow, useMouseEffect, isTouchDevice, hasMouseMoved]);

  const tailOpacity = useMouseEffect ? (opacity ? opacity * 0.6 : 0.4) : 0.4;

  const tailBaseStyle = useMemo(() => ({
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    opacity: tailOpacity,
    animation: (isTouchDevice || !hasMouseMoved) ? `twinkle-${dot.id} ${dot.twinkleDuration}s ease-in-out ${dot.twinkleDelay}s infinite` : 'none',
    filter: 'blur(0.3px)',
    pointerEvents: 'none'
  }), [dot, tailOpacity, isTouchDevice, hasMouseMoved]);

  return (
    <div style={{ position: 'absolute', left: `${dot.x}%`, top: `${dot.y}%`, pointerEvents: 'none' }}>
      <div style={starStyle} />
      {dot.hasTail && (
        <>
          <div style={{ ...tailBaseStyle, top: '50%', left: '50%', width: '1px', height: `${dot.size * 3}px`, transform: `translate(-50%, -50%) rotate(${dot.tailAngle}deg)` }} />
          <div style={{ ...tailBaseStyle, top: '50%', left: '50%', width: `${dot.size * 3}px`, height: '1px', transform: `translate(-50%, -50%) rotate(${dot.tailAngle}deg)` }} />
        </>
      )}
    </div>
  );
});

Star.displayName = 'Star';

const generateDots = () => {
  const dots = [];
  let dotId = 0;
  const numConstellations = 2 + Math.floor(Math.random() * 2);
  const usedConstellations = [];

  for (let i = 0; i < numConstellations; i++) {
    let constellationIndex;
    do { constellationIndex = Math.floor(Math.random() * CONSTELLATIONS.length); } while (usedConstellations.includes(constellationIndex));

    usedConstellations.push(constellationIndex);
    const constellation = CONSTELLATIONS[constellationIndex];
    const baseX = 5 + Math.random() * 90;
    const baseY = 5 + Math.random() * 90;

    constellation.stars.forEach(star => {
      dots.push({
        id: dotId++,
        x: baseX + star.x * 2,
        y: baseY + star.y * 2,
        size: 2 + Math.random() * 1.5,
        twinkleDelay: Math.random() * 5,
        twinkleDuration: Math.random() * 2 + 1.5,
        hasTail: Math.random() > 0.6,
        tailAngle: Math.random() * 360,
        isConstellation: true
      });
    });
  }

  const remainingStars = 60;
  for (let i = 0; i < remainingStars; i++) {
    dots.push({
      id: dotId++,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      twinkleDelay: Math.random() * 5,
      twinkleDuration: Math.random() * 2 + 1.5,
      hasTail: Math.random() > 0.8,
      tailAngle: Math.random() * 360,
      isConstellation: false
    });
  }
  return dots;
};

// ============================================================================ 
// SECTION 6: FORM LOGIC COMPONENT
// ============================================================================ 

const SignupFormContent = memo(() => {
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { registerUser, login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue
  } = useForm({
    defaultValues: { firstName: "", lastName: "", gender: "", acceptTerms: false, birthYear: "", birthMonth: "", birthDay: "", password: "" }
  });

  const birthYear = watch('birthYear');
  const birthMonth = watch('birthMonth');
  const birthDay = watch('birthDay');

  const handleYearBlur = useCallback(() => {
    const year = convertPersianToEnglish(birthYear);
    if (year && year.length === 2 && parseInt(year) >= 0) {
      setValue('birthYear', '13' + year);
    }
  }, [birthYear, setValue]);

  const onSubmit = useCallback(async (data) => {
    setApiError('');
    setIsLoading(true);

    try {
      // بررسی فعال بودن احراز هویت زیبال
      if (ENABLE_ZIBAL_VERIFICATION === 1) {
        // ... Zibal logic (omitted for brevity in replacement if unused, but keeping it for safety) ...
        const response = await fetch('https://api.zibal.ir/v1/facility/nationalIdentityInquiry/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            merchant: 'YOUR_MERCHANT_CODE',
            nationalCode: data.identificationCode,
            birthDate: `${data.birthYear}/${data.birthMonth}/${data.birthDay}`,
            genderInquiry: true
          })
        });

        const result = await response.json();

        if (result.result === 1 && result.data?.matched) {
          if (result.data.firstName !== data.firstName) {
            setApiError("نام با اطلاعات کد ملی همخوانی ندارد.");
            setIsLoading(false);
            return;
          }
          if (result.data.lastName !== data.lastName) {
            setApiError("نام خانوادگی با اطلاعات کد ملی همخوانی ندارد.");
            setIsLoading(false);
            return;
          }

          const userGender = parseInt(data.gender);
          if (result.data.gender !== userGender) {
            setApiError("جنسیت انتخاب شده با اطلاعات کد ملی همخوانی ندارد.");
            setIsLoading(false);
            return;
          }
        } else {
          setApiError("اطلاعات وارد شده با کد ملی همخوانی ندارد.");
          setIsLoading(false);
          return;
        }
      }

      // Backend integration
      const registerData = {
          full_name: `${data.firstName} ${data.lastName}`,
          mobile: convertPersianToEnglish(data.phoneNumber),
          national_id: convertPersianToEnglish(data.identificationCode),
          email: data.email,
          password: data.password,
          gender: data.gender === '1' ? 'male' : 'female',
          birth_date: `${convertPersianToEnglish(data.birthYear)}-${convertPersianToEnglish(data.birthMonth)}-${convertPersianToEnglish(data.birthDay)}`
      };

      await registerUser(registerData);
      
      // Auto Login
      const loginSuccess = await login(registerData.mobile, registerData.password);
      if (loginSuccess) {
          toast.success("Welcome! Please select your seat.");
          navigate('/booking');
      } else {
          toast.success("Registered successfully! Please login.");
          navigate('/login');
      }

    } catch (error) {
      console.error('Registration Error:', error);
      if (error.response && error.response.data) {
          const firstError = Object.values(error.response.data)[0];
          setApiError(Array.isArray(firstError) ? firstError[0] : String(firstError));
      } else {
          setApiError('خطا در ثبت‌نام. لطفاً دوباره تلاش کنید.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate, registerUser, login]);

  const handleSignIn = useCallback(() => navigate("/login"), [navigate]);
  const handleTermsClick = useCallback(() => navigate("/terms"), [navigate]);

  const buttonStyle = useMemo(() => ({
    position: 'relative',
    overflow: 'hidden',
    background: isButtonPressed
      ? 'linear-gradient(135deg, #000000 0%, #0a0a14 100%)'
      : isButtonHovered
      ? 'linear-gradient(135deg, #1a1a1a 0%, #2a2a3e 100%)'
      : 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
    color: '#ffffff',
    fontWeight: 600,
    fontSize: '1.05rem',
    padding: '1.2rem',
    borderRadius: '10px',
    boxShadow: isButtonPressed
      ? '0 0 0 rgba(10, 10, 10, 0), inset 0 4px 12px rgba(0, 0, 0, 0.6)'
      : isButtonHovered
      ? '0 12px 32px rgba(26, 26, 26, 0.7), 0 0 0 4px rgba(255, 255, 255, 0.15), 0 0 40px rgba(100, 100, 255, 0.2)'
      : '0 4px 14px rgba(10, 10, 10, 0.3)',
    transform: isButtonPressed
      ? 'translateY(4px) scale(0.95)'
      : isButtonHovered
      ? 'translateY(-4px) scale(1.02)'
      : 'translateY(0) scale(1)',
    transition: isButtonPressed ? 'all 0.1s cubic-bezier(0.4, 0, 1, 1)' : 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
    letterSpacing: isButtonPressed ? '0.04em' : '0.02em',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    opacity: isLoading ? 0.7 : 1,
    filter: isButtonPressed ? 'brightness(0.7) saturate(1.2)' : isButtonHovered ? 'brightness(1.15) saturate(1.1)' : 'brightness(1)',
    ...FORM_STYLES
  }), [isButtonHovered, isButtonPressed, isLoading]);

  const buttonTextStyle = useMemo(() => ({
    position: 'relative',
    zIndex: 2,
    display: 'inline-block',
    transform: isButtonPressed ? 'scale(0.92)' : 'scale(1)',
    transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
  }), [isButtonPressed]);

  return (
    <CardContent style={{ paddingTop: '1rem', paddingBottom: '1.25rem' }}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {/* Name Fields Row */}
        <div className="grid grid-cols-2 gap-3">
          <div style={INPUT_CONTAINER_STYLE}>
            <Label htmlFor="firstName" style={{ color: '#1a202c', fontWeight: 700, fontSize: '0.875rem', letterSpacing: '-0.01em' }}>نام</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="امیر"
              onKeyDown={handleTextOnlyInput}
              style={INPUT_STYLES}
              {...register("firstName", { required: "نام الزامی است", minLength: { value: 2, message: "نام باید حداقل ۲ حرف باشد" }, onChange: () => setApiError('') })}
            />
            {errors.firstName && <p style={ERROR_STYLES}>{errors.firstName.message}</p>}
          </div>
          <div style={INPUT_CONTAINER_STYLE}>
            <Label htmlFor="lastName" style={{ color: '#1a202c', fontWeight: 700, fontSize: '0.875rem', letterSpacing: '-0.01em' }}>نام خانوادگی</Label>
            <Input
              id="lastName"
              type="text"
              placeholder="صادقی پارانی"
              onKeyDown={handleTextOnlyInput}
              style={INPUT_STYLES}
              {...register("lastName", { required: "نام خانوادگی الزامی است", minLength: { value: 2, message: "نام خانوادگی باید حداقل ۲ حرف باشد" }, onChange: () => setApiError('') })}
            />
            {errors.lastName && <p style={ERROR_STYLES}>{errors.lastName.message}</p>}
          </div>
        </div>

        {/* Gender Selection */}
        <div style={INPUT_CONTAINER_STYLE}>
          <Label style={{ color: '#1a202c', fontWeight: 700, fontSize: '0.875rem', letterSpacing: '-0.01em' }}>جنسیت</Label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Controller
              name="gender"
              control={control}
              rules={{ required: "انتخاب جنسیت الزامی است" }}
              render={({ field }) => (
                <>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', flex: 1, padding: '0.75rem', borderRadius: '8px', background: field.value === '1' ? 'rgba(37, 99, 235, 0.1)' : 'linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%)', border: field.value === '1' ? '2px solid #2563eb' : '2px solid #e2e8f0', transition: 'all 0.2s ease', ...FORM_STYLES }}>
                    <input type="radio" value="1" checked={field.value === '1'} onChange={(e) => { field.onChange(e.target.value); setApiError(''); }} style={{ display: 'none' }} />
                    <div style={{ color: field.value === '1' ? '#2563eb' : '#64748b' }}><MaleIcon /></div>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: field.value === '1' ? '#2563eb' : '#1a202c' }}>آقا</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', flex: 1, padding: '0.75rem', borderRadius: '8px', background: field.value === '2' ? 'rgba(37, 99, 235, 0.1)' : 'linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%)', border: field.value === '2' ? '2px solid #2563eb' : '2px solid #e2e8f0', transition: 'all 0.2s ease', ...FORM_STYLES }}>
                    <input type="radio" value="2" checked={field.value === '2'} onChange={(e) => { field.onChange(e.target.value); setApiError(''); }} style={{ display: 'none' }} />
                    <div style={{ color: field.value === '2' ? '#2563eb' : '#64748b' }}><FemaleIcon /></div>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: field.value === '2' ? '#2563eb' : '#1a202c' }}>خانم</span>
                  </label>
                </>
              )}
            />
          </div>
          {errors.gender && <p style={ERROR_STYLES}>{errors.gender.message}</p>}
        </div>

        {/* Email Field */}
        <div style={INPUT_CONTAINER_STYLE}>
          <Label htmlFor="email" style={{ color: '#1a202c', fontWeight: 700, fontSize: '0.875rem', letterSpacing: '-0.01em' }}>ایمیل</Label>
          <Input id="email" type="email" placeholder="amir@example.com" dir="ltr" style={{ ...INPUT_STYLES, textAlign: 'left' }} {...register("email", { required: "ایمیل الزامی است", pattern: { value: EMAIL_REGEX, message: "آدرس ایمیل معتبر نیست" } })}
          />
          {errors.email && <p style={ERROR_STYLES}>{errors.email.message}</p>}
        </div>

        {/* Password Field (Added) */}
        <div style={INPUT_CONTAINER_STYLE}>
          <Label htmlFor="password" style={{ color: '#1a202c', fontWeight: 700, fontSize: '0.875rem', letterSpacing: '-0.01em' }}>کلمه عبور</Label>
          <Input id="password" type="password" placeholder="******" dir="ltr" style={{ ...INPUT_STYLES, textAlign: 'left' }} {...register("password", { required: "کلمه عبور الزامی است", minLength: { value: 6, message: "کلمه عبور باید حداقل ۶ کاراکتر باشد" } })}
          />
          {errors.password && <p style={ERROR_STYLES}>{errors.password.message}</p>}
        </div>

        {/* Date of Birth Selection */}
        <div style={INPUT_CONTAINER_STYLE}>
          <Label style={{ color: '#1a202c', fontWeight: 700, fontSize: '0.875rem', letterSpacing: '-0.01em' }}>تاریخ تولد</Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem', background: 'linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%)', border: '2px solid #e2e8f0', borderRadius: '6px', direction: 'ltr', justifyContent: 'center' }}>
            {/* Year Input */}
            <Controller
              name="birthYear" control={control} rules={{ required: true }}
              render={({ field }) => (
                <input {...field} type="text" inputMode="numeric" placeholder="1374" maxLength={4} onKeyDown={handleNumericInput} onBlur={handleYearBlur}
                  onChange={(e) => { const value = convertPersianToEnglish(e.target.value); if (/^\d{0,4}$/.test(value)) { field.onChange(value); setApiError(''); } }}
                  style={{ border: 'none', outline: 'none', background: 'transparent', width: '3.5rem', textAlign: 'center', fontWeight: 700, fontSize: '0.95rem', fontVariantNumeric: 'tabular-nums', ...FORM_STYLES }} />
              )}
            />
            <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: '1.1rem', margin: '0 -0.2rem' }}>/</span>

            {/* Month Picker */}
            <div style={{ position: 'relative' }}>
              <Controller
                name="birthMonth" control={control} rules={{ required: true }}
                render={({ field }) => (
                  <>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <button type="button" onClick={() => setShowMonthPicker(!showMonthPicker)} style={{ border: 'none', outline: 'none', background: 'transparent', cursor: 'pointer', padding: '0.25rem 0', fontWeight: 700, fontSize: '0.875rem', color: field.value ? '#0a0a0a' : '#94a3b8', position: 'relative', minWidth: '4.5rem', textAlign: 'center', paddingRight: '1.25rem', ...FORM_STYLES }}>
                        {field.value ? field.value : 'ماه'}
                      </button>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><path d="M6 9L1 4h10z" fill="#64748b"/></svg>
                    </div>
                    {showMonthPicker && (
                      <>
                        <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setShowMonthPicker(false)} />
                        <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '0.5rem', background: 'white', border: '2px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: '200px', overflowY: 'auto', zIndex: 20, minWidth: '120px', ...FORM_STYLES }}>
                          {PERSIAN_MONTHS.map(month => (
                            <div key={month.value} onClick={() => { field.onChange(month.value); setShowMonthPicker(false); setApiError(''); }}
                              style={{ padding: '0.75rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', transition: 'background 0.2s', background: field.value === month.value ? '#f0f9ff' : 'transparent' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f0f9ff'} onMouseLeave={(e) => e.currentTarget.style.background = field.value === month.value ? '#f0f9ff' : 'transparent'}
                            >
                              {month.label}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              />
            </div>
            <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: '1.1rem', margin: '0 -0.2rem' }}>/</span>
            {/* Day Input */}
            <Controller
              name="birthDay" control={control} rules={{ required: true }}
              render={({ field }) => (
                <input {...field} type="text" inputMode="numeric" placeholder="23" maxLength={2} onKeyDown={handleNumericInput}
                  onChange={(e) => { const value = convertPersianToEnglish(e.target.value); if (/^\d{0,2}$/.test(value)) { field.onChange(value); setApiError(''); } }}
                  style={{ border: 'none', outline: 'none', background: 'transparent', width: '2.5rem', textAlign: 'center', fontWeight: 700, fontSize: '0.95rem', fontVariantNumeric: 'tabular-nums', ...FORM_STYLES }} />
              )}
            />
          </div>
          {(errors.birthDay || errors.birthMonth || errors.birthYear) && !apiError && <p style={ERROR_STYLES}>تاریخ تولد الزامی است</p>}
          {birthDay && birthMonth && birthYear && !validatePersianDate(birthYear, birthMonth, birthDay) && !apiError && <p style={ERROR_STYLES}>تاریخ تولد معتبر نیست</p>}
        </div>

        {/* National Code Field */}
        <div style={INPUT_CONTAINER_STYLE}>
          <Label htmlFor="identificationCode" style={{ color: '#1a202c', fontWeight: 700, fontSize: '0.875rem', letterSpacing: '-0.01em' }}>کد ملی</Label>
          <Input id="identificationCode" type="text" placeholder="0123456789" dir="ltr" onKeyDown={handleNumericInput} maxLength={10} style={{ ...INPUT_STYLES, textAlign: 'left', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.05em' }} {...register("identificationCode", { required: "کد ملی الزامی است", validate: { validNationalCode: (value) => validateNationalCode(value) || "کد ملی وارد شده معتبر نیست" }, onChange: () => setApiError('') })} />
          {errors.identificationCode && <p style={ERROR_STYLES}>{errors.identificationCode.message}</p>}
        </div>

        {/* API Error Display */}
        {apiError && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', padding: '0.625rem 0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}><circle cx="8" cy="8" r="7" stroke="#e53e3e" strokeWidth="2"/><path d="M8 4v5M8 11h.01" stroke="#e53e3e" strokeWidth="2" strokeLinecap="round"/></svg>
            <p style={{ color: '#e53e3e', fontWeight: 600, fontSize: '0.8rem', margin: 0 }}>{apiError}</p>
          </div>
        )}

        {/* Phone Number Field */}
        <div style={INPUT_CONTAINER_STYLE}>
          <Label htmlFor="phoneNumber" style={{ color: '#1a202c', fontWeight: 700, fontSize: '0.875rem', letterSpacing: '-0.01em' }}>شماره موبایل</Label>
          <Input id="phoneNumber" type="tel" placeholder="09123456789" dir="ltr" onKeyDown={handlePhoneInput} style={{ ...INPUT_STYLES, textAlign: 'left', fontVariantNumeric: 'tabular-nums' }} {...register("phoneNumber", { required: "شماره موبایل الزامی است", validate: { validPhone: (value) => validatePhoneNumber(value) || "فرمت شماره موبایل صحیح نیست" } })} />
          {errors.phoneNumber && <p style={ERROR_STYLES}>{errors.phoneNumber.message}</p>}
        </div>

        {/* Terms Checkbox */}
        <div className="flex items-start gap-2.5" style={{ paddingTop: '0.25rem' }}>
          <Controller name="acceptTerms" control={control} rules={{ required: "باید قوانین و مقررات را بپذیرید" }} render={({ field }) => (<Checkbox id="acceptTerms" checked={field.value} onCheckedChange={field.onChange} style={{ marginTop: '2px' }} />)} />
          <div className="space-y-1 flex-1 relative">
            <Label htmlFor="acceptTerms" className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" style={{ color: '#2d3748', fontWeight: 600, fontSize: '0.85rem', display: 'block', lineHeight: '1.4' }}>
              <a href="/terms" onClick={(e) => { e.preventDefault(); handleTermsClick(); }} style={{ color: '#2563eb', fontWeight: 700, textDecoration: 'none', cursor: 'pointer', transition: 'color 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#1d4ed8'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#2563eb'; }}>قوانین و مقررات</a> را می‌پذیرم
            </Label>
            {errors.acceptTerms && <p style={{ ...ERROR_STYLES, bottom: '-1.5rem' }}>{errors.acceptTerms.message}</p>}
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading} style={buttonStyle} onMouseEnter={() => !isLoading && setIsButtonHovered(true)} onMouseLeave={() => { setIsButtonHovered(false); setIsButtonPressed(false); }} onMouseDown={() => !isLoading && setIsButtonPressed(true)} onMouseUp={() => setIsButtonPressed(false)}>
          <span style={buttonTextStyle}>{isLoading ? 'در حال ثبت‌نام...' : 'ثبت‌نام'}</span>
        </Button>

        <div style={{ textAlign: 'center', marginTop: '1rem', paddingTop: '0.875rem', borderTop: '1px solid #e2e8f0' }}>
          <p style={{ color: '#4a5568', fontWeight: 600, fontSize: '0.85rem', ...FORM_STYLES }}>
            حساب کاربری دارید؟{' '}<a href="/signin" onClick={(e) => { e.preventDefault(); handleSignIn(); }} style={{ color: '#2563eb', fontWeight: 700, textDecoration: 'none', cursor: 'pointer', transition: 'color 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#1d4ed8'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#2563eb'; }}>ورود</a>
          </p>
        </div>
      </form>
    </CardContent>
  );
});

export function SignupForm() {
  const [mouseX, setMouseX] = useState(50);
  const [mouseY, setMouseY] = useState(50);
  const [dots] = useState(() => generateDots());
  const [hasMouseMoved, setHasMouseMoved] = useState(false);
  const [isTouchDevice] = useState(() => 
    typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  );
  const animationFrameRef = useRef();

  useEffect(() => {
    const link = document.createElement('link');
    link.href = VAZIRMATN_FONT_URL;
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const starKeyframes = dots.map(dot => {
      const minOpacity = 0.3 + Math.random() * 0.2;
      const maxOpacity = 0.85 + Math.random() * 0.15;
      const maxScale = 1.5 + Math.random() * 0.5;
      const maxBrightness = 1.3 + Math.random() * 0.4;
      return `@keyframes twinkle-${dot.id} { 0%, 100% { opacity: ${minOpacity}; transform: scale(1); filter: brightness(1); } 50% { opacity: ${maxOpacity}; transform: scale(${maxScale}); filter: brightness(${maxBrightness}); } }`;
    }).join('\n');

    const style = document.createElement('style');
    style.textContent = `${starKeyframes} #phoneNumber::placeholder, #identificationCode::placeholder { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-weight: 500; }`;
    document.head.appendChild(style);

    const handleMouseMove = (e) => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = requestAnimationFrame(() => {
        setHasMouseMoved(true);
        setMouseX(e.clientX);
        setMouseY(e.clientY);
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (style.parentNode) document.head.removeChild(style);
      if (link.parentNode) document.head.removeChild(link);
    };
  }, [dots]);

  const mousePositions = useMemo(() => {
    const mouseXPercent = mouseX / (typeof window !== 'undefined' ? window.innerWidth : 1024);
    const mouseYPercent = mouseY / (typeof window !== 'undefined' ? window.innerHeight : 768);
    return {
      mouseXPercent,
      mouseYPercent,
      blueX: 85 + (mouseXPercent * 10 - 5),
      blueY: 15 + (mouseYPercent * 15),
      purpleX: 50 + (mouseXPercent * 10 - 5),
      purpleY: 40 + (mouseYPercent * 20 - 10)
    };
  }, [mouseX, mouseY]);

  const getDistance = useCallback((dotX, dotY) => {
    const dx = mousePositions.mouseXPercent * 100 - dotX;
    const dy = mousePositions.mouseYPercent * 100 - dotY;
    return Math.sqrt(dx * dx + dy * dy);
  }, [mousePositions.mouseXPercent, mousePositions.mouseYPercent]);

  const backgroundGradient = useMemo(() => `
    linear-gradient(${45 + mousePositions.mouseXPercent * 20}deg, rgba(242, 38, 31, 0.28) 0%, rgba(242, 38, 31, 0.18) 15%, rgba(242, 38, 31, 0.08) 25%, transparent 35%),
    radial-gradient(ellipse 72% 84% at ${mousePositions.blueX}% ${mousePositions.blueY}%, rgba(10, 40, 194, 0.56) 0%, rgba(15, 38, 190, 0.48) 25%, rgba(20, 35, 180, 0.38) 45%, rgba(25, 30, 160, 0.28) 60%, rgba(28, 25, 140, 0.18) 75%, rgba(30, 20, 120, 0.08) 88%, transparent 100%),
    radial-gradient(ellipse 123% 135% at ${mousePositions.purpleX}% ${mousePositions.purpleY}%, rgba(27, 19, 79, 0.7) 0%, rgba(22, 15, 75, 0.6) 22%, rgba(18, 10, 70, 0.48) 40%, rgba(15, 8, 65, 0.35) 55%, rgba(12, 7, 79, 0.22) 70%, transparent 100%)
  `, [mousePositions]);

  const containerStyle = useMemo(() => ({
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', overflow: 'hidden', backgroundColor: '#000000', ...FORM_STYLES
  }), []);

  const cardStyle = useMemo(() => ({
    position: 'relative', zIndex: 100, backdropFilter: 'blur(14px) saturate(180%)', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(250, 250, 252, 0.94) 100%)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.45), 0 2px 8px rgba(10, 40, 194, 0.15)', border: '1.5px solid rgba(255, 255, 255, 0.4)', borderRadius: '16px', maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto', ...FORM_STYLES
  }), []);

  return (
    <div style={containerStyle}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: backgroundGradient, transition: 'background 0.3s ease-out', pointerEvents: 'none' }} />
      {dots.map((dot) => (
        <Star key={dot.id} dot={dot} distance={getDistance(dot.x, dot.y)} hasMouseMoved={hasMouseMoved} isTouchDevice={isTouchDevice} />
      ))}
      <Card className="w-full max-w-md" dir="rtl" style={cardStyle}>
        <CardHeader style={{ paddingBottom: '0.75rem', paddingTop: '1.25rem' }}>
          <CardTitle style={{ color: '#1a202c', fontWeight: 700, fontSize: '1.35rem', letterSpacing: '-0.01em', marginBottom: '0.35rem' }}>ساخت حساب کاربری</CardTitle>
          <CardDescription style={{ color: '#64748b', fontWeight: 500, fontSize: '0.875rem', lineHeight: '1.5' }}>اطلاعات خود را برای شروع وارد کنید</CardDescription>
        </CardHeader>
        <SignupFormContent />
      </Card>
    </div>
  );
}
