@echo off
echo 🔧 Stopping all Gradle daemons...
cd android
call gradlew --stop

echo 🧹 Cleaning project...
call gradlew clean

echo 🗑 Deleting Gradle and build caches...
cd ..
rmdir /s /q ".gradle"
rmdir /s /q "android\.gradle"
rmdir /s /q "android\app\build"
rmdir /s /q "android\build"

echo 🚀 Running the app...
npx react-native run-android

pause
