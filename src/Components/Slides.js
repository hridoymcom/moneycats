import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from "../firebase/firestore";

const slides = [
  {
    title: 'DAILY CHECKIN',
    description: 'Claim daily checkin rewards',
    link: '/checkin',
  },
  {
    title: '$MCATS COMMUNITY',
    description: 'Join MONEY CATS community',
    link: 'https://t.me/MoneyCatsCommunity',
  },
];

const CommunitySlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideInterval = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hasJoined, setHasJoined] = useState(null); // fixed
  console.log(hasJoined);
  const handleNextSlide = useCallback(() => {
    setIsTransitioning(true);
    setCurrentSlide((prevSlide) => prevSlide + 1);
  }, []);

  const handlePrevSlide = useCallback(() => {
    setIsTransitioning(true);
    setCurrentSlide((prevSlide) => prevSlide - 1);
  }, []);

  const startSlideInterval = useCallback(() => {
    slideInterval.current = setInterval(() => {
      handleNextSlide();
    }, 5000);
  }, [handleNextSlide]);

  const stopSlideInterval = useCallback(() => {
    clearInterval(slideInterval.current);
  }, []);

  useEffect(() => {
    startSlideInterval();
    return () => stopSlideInterval();
  }, [startSlideInterval, stopSlideInterval]);

  const handleDotClick = (index) => {
    stopSlideInterval();
    setIsTransitioning(true);
    setCurrentSlide(index);
    startSlideInterval();
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].screenX;
    handleSwipe();
  };

  const handleSwipe = () => {
    if (touchStartX.current - touchEndX.current > 50) {
      handleNextSlide();
    } else if (touchEndX.current - touchStartX.current > 50) {
      handlePrevSlide();
    }
  };

  useEffect(() => {
    if (isTransitioning) {
      const transitionEnd = setTimeout(() => {
        setIsTransitioning(false);
        if (currentSlide >= slides.length) {
          setCurrentSlide(0);
        } else if (currentSlide < 0) {
          setCurrentSlide(slides.length - 1);
        }
      }, 500);
      return () => clearTimeout(transitionEnd);
    }
  }, [currentSlide, isTransitioning]);

  useEffect(() => {
    const checkJoinedStatus = async () => {
      if (typeof window === 'undefined' || !window?.Telegram?.WebApp?.initDataUnsafe?.user) {
        console.log('Telegram user not found');
        return;
      }

      const tgUser = window.Telegram.WebApp.initDataUnsafe.user;

      try {
        const userRef = doc(db, 'telegramUsers', tgUser.id.toString());
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          setHasJoined(userData.hasJoined);
        } else {
          await setDoc(userRef, {
            username: tgUser.username || '',
            first_name: tgUser.first_name || '',
            hasJoined: false,
          });
          setHasJoined(false);
        }
      } catch (err) {
        console.error('Error checking join status:', err);
      }
    };

    checkJoinedStatus();
  }, []);

  return (
    <div className="relative w-full max-w-xl mx-auto overflow-hidden">
      <div
        className={`flex ${isTransitioning ? 'transition-transform duration-500' : ''}`}
        style={{ transform: `translateX(-${(currentSlide % slides.length) * 90}%)` }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {slides.concat(slides[0]).map((slide, index) => (
          <div key={index} className="min-w-[90%]">
            <div className="bg-[#17181A] mr-4 rounded-[12px] py-6 px-4 flex flex-col">
              <h2 className="font-medium">{slide.title}</h2>
              <p className="pb-2 text-[14px]">{slide.description}</p>

              {index === 0 ? (
  <NavLink
    to={slide.link}
    className="bg-btn4 py-1 px-3 text-[16px] font-semibold w-fit rounded-[30px]"
  >
    Claim
  </NavLink>
) : (
  !hasJoined && (
    <a
      href={slide.link}
      className="bg-btn4 py-1 px-3 text-[16px] font-semibold w-fit rounded-[30px]"
      target="_blank"
      rel="noopener noreferrer"
    >
      Join
    </a>
  )
)}

            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-3 space-x-2">
        {slides.map((_, index) => (
          <span
            key={index}
            className={`w-2 h-2 rounded-full cursor-pointer ${
              index === (currentSlide % slides.length) ? 'bg-white' : 'bg-gray-400'
            }`}
            onClick={() => handleDotClick(index)}
          ></span>
        ))}
      </div>
    </div>
  );
};

export default CommunitySlider;
