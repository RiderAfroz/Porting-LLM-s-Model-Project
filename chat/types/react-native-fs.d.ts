declare module 'react-native-fs' {
    interface RNFS {
      unlink(voskZipPath: string): unknown;
      exists(voskLocalPath: string): unknown;
      unzip(source: string, target: string): Promise<void>;
    }
    const RNFS: RNFS;
    export default RNFS;
}