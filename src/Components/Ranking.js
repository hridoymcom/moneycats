import React from 'react';
import { useUser } from '../context/userContext';
import BoostRank from './BoostRank';

const UserRanking = () => {
  const { leaderBoard, activeUserRank, fullName, balance } = useUser();

  const getInitials = (username = '') => {
    const nameParts = username.split(' ');
    return nameParts.length > 0
      ? nameParts[0].charAt(0).toUpperCase() + (nameParts[0].charAt(1)?.toUpperCase() || '')
      : 'NA';
  };

  const getRandomColor = () => {
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const rankImages = [
    '/1st.webp',
    '/2nd.webp',
    '/3rd.webp',
    '/4th.webp',
    '/5th.webp',
    '/6th.webp',
    '/7th.webp',
    '/8th.webp',
    '/9th.webp',
    '/10th.webp',
  ];

  const formatNumber = (num) => {
    if (num < 100000) {
      return new Intl.NumberFormat().format(num).replace(/,/g, ' ');
    } else if (num < 1000000) {
      return new Intl.NumberFormat().format(num).replace(/,/g, ' ');
    } else {
      return (num / 1000000).toFixed(3).replace('.', '.') + ' M';
    }
  };

  const shortenName = (name) => (name.length > 16 ? name.substring(0, 16) + '...' : name);

  // Ensure leaderboard is sorted and handle empty data gracefully
  const sortedLeaderBoard = leaderBoard?.slice().sort((a, b) => b.balance - a.balance) || [];

  // Limit the displayed users to 200
  const displayedLeaderBoard = sortedLeaderBoard.slice(0, 200);

  return (
    <>
      <div className="w-full flex flex-col pt-24 space-y-3 justify-center items-center relative">
        <img src="/circle.svg" alt="" className="w-full absolute top-[-40px] hidden" />

        {/* Top 3 Users */}
        <div className="w-full flex items-center justify-center gap-4 relative">
          {displayedLeaderBoard.length > 0 &&
            displayedLeaderBoard
              .slice(0, Math.min(3, displayedLeaderBoard.length))
              .map((leader, index) => (
                <div
                  key={leader.id || index}
                  className={`flex flex-col items-center justify-center ${index === 0 ? 'absolute mt-[-100px]' : index === 1 ? 'absolute left-8 mt-[-50px]' : 'absolute right-6 mt-[-4px]'}`}
                >
                  {index === 0 && (
                    <img
                      src="/medal2.svg"
                      alt="First place medal"
                      className="absolute mt-[-90px] w-[24px]"
                    />
                  )}
                  <img src={rankImages[index]} alt={`Rank ${index + 1}`} className="w-[40px]" />
                  <h2 className="font-medium text-[11px] pt-3 pb-1">{leader.username}</h2>
                  <div className="flex items-center space-x-1 text-[11px] font-semibold">
                    <img src="/stars2.svg" alt="Stars icon" className="w-[12px]" />
                    <span>{formatNumber(leader.balance)}</span>
                  </div>
                </div>
              ))}
        </div>

        <div className="flex flex-col w-[85%] items-center justify-center !mb-[-60px]">
          <img src="/ranks.svg" alt="Leaderboard ranks" />
        </div>

        {/* BoostRank and Current User Rank */}
        <div className="w-full relative bg-[#090600] rounded-[8px] leadershadow flex flex-col space-y-2">
          <BoostRank />

          <div className="bg-[#202124] py-2 px-3 flex flex-col font-medium w-full rounded-[8px]">
            <h2 className="text-[13px] text-secondary font-semibold">Your Rank</h2>
            <div className="w-full rounded-[16px] py-2 flex items-center justify-between space-x-3">
              <div className="w-fit">
                <div
                  className={`flex items-center justify-center h-[38px] w-[38px] rounded-full p-1 ${getRandomColor()}`}
                >
                  <span className="font-semibold text-[14px]">{getInitials(fullName)}</span>
                </div>
              </div>
              <div className="flex h-full flex-1 flex-col justify-center relative">
                <div className="flex w-full flex-col justify-between h-full space-y-[2px]">
                  <h1 className="text-[14px] text-nowrap line-clamp-1 font-medium">{shortenName(fullName)}</h1>
                  <span className="flex items-center gap-1 flex-1 text-[12px]">
                    <img src="/stars2.svg" alt="Stars icon" className="w-[10px]" />
                    <span className="text-[12px] text-nowrap font-medium">{formatNumber(balance)}</span>
                  </span>
                </div>
              </div>
              <div className="w-fit flex items-center justify-end flex-wrap text-[14px] relative px-1">
                <button className={`font-semibold ease-in duration-200`}>#{activeUserRank}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Leaderboard */}
      <div className="w-full flex flex-col space-y-3 pt-3">
        {displayedLeaderBoard.map((user, index) => (
          <div
            key={user.id || index}
            className="w-full rounded-[16px] py-3 flex items-center justify-between space-x-3"
          >
            <div className="w-fit">
              <div
                className={`flex items-center justify-center h-[42px] w-[42px] rounded-full p-1 ${getRandomColor()}`}
              >
                {user.photo_url ? (
                  <img
                    src={user.photo_url}
                    alt={`Profile of ${user.username}`}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="font-semibold text-[14px]">{getInitials(user.fullName)}</span>
                )}
              </div>
            </div>
            <div className="flex h-full flex-1 flex-col justify-center relative">
              <div className="flex w-full flex-col justify-between h-full space-y-[2px]">
                <h1 className="text-[14px] text-nowrap line-clamp-1 font-medium">
                  {shortenName(user.fullName)}
                </h1>
                <span className="flex items-center gap-1 flex-1 text-[12px]">
                  <img src="/stars2.svg" alt="Stars icon" className="w-[10px]" />
                  <span className="text-[12px] text-nowrap font-medium">{formatNumber(user.balance)}</span>
                </span>
              </div>
            </div>
            <div className="w-fit flex items-center justify-end flex-wrap text-[14px] relative px-4">
              {index < 10 ? (
                <img
                  src={rankImages[index]}
                  alt={`Rank ${index + 1}`}
                  className="w-[24px] h-auto"
                />
              ) : (
                <button className={`font-semibold ease-in duration-200`}>#{index + 1}</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default UserRanking;