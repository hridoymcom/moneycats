import React, { useState, useEffect, useRef, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firestore';
import { useUser} from '../context/userContext';

const slides = [
  {
    id: 'checkin',
    title: 'DAILY CHECKIN',
    description: 'Claim daily checkin rewards',
    link: '/checkin',
    type: 'internal',
  },
  {
    id: 'community',
    title: '$MCATS COMMUNITY',
    description: 'Join MONEY CATS community',
    link: 'https://t.me/MoneyCatsCommunity',
    type: 'external',
  },
];

const CommunitySlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [filteredSlides, setFilteredSlides] = useState(slides);
  const slideInterval = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { user } = useContext(useUser);

  const startSlideInterval = () => {
    slideInterval.current = setInterval(() => {
      handleNextSlide();
    }, 5000);
  };

  const stopSlideInterval = () => {
    clearInterval(slideInterval.current);
  };
// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    startSlideInterval();
    return () => stopSlideInterval();
  }, []);

  useEffect(() => {
    const checkJoinedStatus = async () => {
      if (!user?.id) return;

      const userRef = doc(db, 'telegramUsers', user.id.toString());
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.hasJoined) {
          setFilteredSlides(slides.filter(slide => slide.id !== 'community'));
        }
      }
    };

    checkJoinedStatus();
  }, [user]);

  const handleNextSlide = () => {
    setIsTransitioning(true);
    setCurrentSlide((prevSlide) => prevSlide + 1);
  };

  const handlePrevSlide = () => {
    setIsTransitioning(true);
    setCurrentSlide((prevSlide) => prevSlide - 1);
  };

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
        if (currentSlide >= filteredSlides.length) {
          setCurrentSlide(0);
        } else if (currentSlide < 0) {
          setCurrentSlide(filteredSlides.length - 1);
        }
      }, 500);
      return () => clearTimeout(transitionEnd);
    }
  }, [currentSlide, isTransitioning, filteredSlides]);

  const handleJoinClick = async (link) => {
    if (!user?.id) return;

    const userRef = doc(db, 'telegramUsers', user.id.toString());
    try {
      await setDoc(userRef, { hasJoined: true }, { merge: true });
      setFilteredSlides(filteredSlides.filter(slide => slide.id !== 'community'));
      window.open(link, '_blank');
    } catch (err) {
      console.error('Error updating join status:', err);
    }
  };

  return (
    <div className="relative w-full max-w-xl mx-auto overflow-hidden">
      <div
        className={`flex ${isTransitioning ? 'transition-transform duration-500' : ''}`}
        style={{ transform: `translateX(-${(currentSlide % filteredSlides.length) * 90}%)` }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {filteredSlides.concat(filteredSlides[0]).map((slide, index) => (
          <div key={index} className="min-w-[90%]">
            <div className="bg-[#17181A] mr-4 rounded-[12px] py-6 px-4 flex flex-col">
              <h2 className="font-medium">{slide.title}</h2>
              <p className="pb-2 text-[14px]">{slide.description}</p>
              {slide.type === 'internal' ? (
                <NavLink
                  to={slide.link}
                  className="bg-btn4 py-1 px-3 text-[16px] font-semibold w-fit rounded-[30px]"
                >
                  Claim
                </NavLink>
              ) : (
                <button
                  onClick={() => handleJoinClick(slide.link)}
                  className="bg-btn4 py-1 px-3 text-[16px] font-semibold w-fit rounded-[30px]"
                >
                  Join
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-3 space-x-2">
        {filteredSlides.map((_, index) => (
          <span
            key={index}
            className={`w-2 h-2 rounded-full cursor-pointer ${
              index === (currentSlide % filteredSlides.length) ? 'bg-white' : 'bg-gray-400'
            }`}
            onClick={() => handleDotClick(index)}
          ></span>
        ))}
      </div>
    </div>
  );
};

export default CommunitySlider;
